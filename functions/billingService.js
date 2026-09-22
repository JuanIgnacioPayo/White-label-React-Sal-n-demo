const admin = require('firebase-admin');

async function getCurrentCost() {
    const { BigQuery } = require('@google-cloud/bigquery');
    try {
        // 1. Get Project ID
        const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || (admin.instanceId() && admin.instanceId().app.options.projectId);
        console.log(`Debug Billing: Project ID resolved to: ${projectId} `);

        if (!projectId) {
            throw new Error("Could not determine Project ID");
        }

        const bigquery = new BigQuery({ projectId });

        // 2. Find the Billing Table
        const datasetId = 'billing_data';

        let tables = [];
        try {
            // Skip explicit exists check, try to get tables directly to find the export
            [tables] = await bigquery.dataset(datasetId).getTables();
        } catch (e) {
            console.error("Error listing tables for billing_data:", e);
            return {
                amount: 0,
                currencyCode: 'USD',
                status: 'no_dataset',
                message: `Dataset "billing_data" not accessible: ${e.message}`
            };
        }

        const exportTable = tables.find(t => t.id.startsWith('gcp_billing_export_v1_'));

        if (!exportTable) {
            return {
                amount: 0,
                currencyCode: 'USD',
                status: 'no_table',
                message: 'Billing export table not found in dataset "billing_data". Check Billing Export settings.'
            };
        }

        const tableName = exportTable.id;
        const fullTableName = `${projectId}.${datasetId}.${tableName}`;
        console.log(`Debug Billing: Querying table ${fullTableName}`);

        // 3. Query for Current Month's Cost by Service
        // We calculate (cost - credits) to get the actual spend.
        const query = `
SELECT
    service.description as service_name,
    SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) as net_cost,
    MAX(export_time) as last_updated
            FROM \`${fullTableName}\`
            WHERE usage_start_time >= TIMESTAMP(DATE_TRUNC(CURRENT_DATE(), MONTH))
            GROUP BY 1
            HAVING net_cost > 0.00
            ORDER BY 2 DESC
        `;

        const options = {
            query: query,
            location: 'US', // Adjust if dataset is in another region, usually matches project default
        };

        const [job] = await bigquery.createQueryJob(options);
        const [rows] = await job.getQueryResults();

        console.log(`Debug Billing: Query results: ${rows.length} rows`);

        // 4. Calculate Total, Breakdown, and Last Updated
        let totalCost = 0;
        let lastUpdated = null;

        const breakdown = rows.map(row => {
            const cost = parseFloat(row.net_cost);
            totalCost += cost;
            if (row.last_updated && (!lastUpdated || new Date(row.last_updated.value) > new Date(lastUpdated))) {
                // BigQuery timestamp is usually an object like { value: '...' } or a string depending on client version
                // ensuring we get the string value
                lastUpdated = row.last_updated.value || row.last_updated;
            }
            return {
                service: row.service_name,
                amount: cost.toFixed(2)
            };
        });

        // 5. Query for History (Last 6 Months)
        const historyQuery = `
            SELECT
                FORMAT_DATE('%Y-%m', DATE(usage_start_time)) as month,
                SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) as net_cost
            FROM \`${fullTableName}\`
            WHERE usage_start_time >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH))
            GROUP BY 1
            ORDER BY 1 DESC
        `;

        let history = [];
        try {
            const [historyRows] = await bigquery.query({ query: historyQuery, location: 'US' });
            history = historyRows.map(row => ({
                month: row.month,
                amount: parseFloat(row.net_cost).toFixed(2)
            }));
        } catch (historyError) {
            console.error("Error fetching billing history:", historyError);
            // Non-fatal, return empty history
        }

        // 6. Query for Previous Month Breakdown (Specific Request)
        const previousMonthQuery = `
            SELECT
                service.description as service_name,
                SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) as net_cost
            FROM \`${fullTableName}\`
            WHERE usage_start_time >= TIMESTAMP(DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), MONTH))
              AND usage_start_time < TIMESTAMP(DATE_TRUNC(CURRENT_DATE(), MONTH))
            GROUP BY 1
            HAVING net_cost > 0.00
            ORDER BY 2 DESC
            LIMIT 5
        `;

        let previousMonthBreakdown = [];
        try {
            const [prevRows] = await bigquery.query({ query: previousMonthQuery, location: 'US' });
            previousMonthBreakdown = prevRows.map(row => ({
                service: row.service_name,
                amount: parseFloat(row.net_cost).toFixed(2)
            }));
        } catch (prevError) {
            console.error("Error fetching previous month breakdown:", prevError);
        }

        // 7. Query for Gemini Breakdown (Specific Request) including Project
        const geminiBreakdownQuery = `
            SELECT
                project.name as project_name,
                sku.description as sku_name,
                SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) as net_cost,
                SUM(usage.amount) as total_usage,
                MAX(usage.unit) as usage_unit
            FROM \`${fullTableName}\`
            WHERE (service.description LIKE '%Gemini%' OR service.description LIKE '%Vertex AI%')
              AND usage_start_time >= TIMESTAMP(DATE_TRUNC(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), MONTH))
              AND usage_start_time < TIMESTAMP(DATE_TRUNC(CURRENT_DATE(), MONTH))
            GROUP BY 1, 2
            HAVING net_cost > 0.00
            ORDER BY 3 DESC
            LIMIT 10
        `;

        let geminiBreakdown = [];
        try {
            const [geminiRows] = await bigquery.query({ query: geminiBreakdownQuery, location: 'US' });
            geminiBreakdown = geminiRows.map(row => ({
                project: row.project_name,
                sku: row.sku_name,
                amount: parseFloat(row.net_cost).toFixed(2),
                usage: parseFloat(row.total_usage).toLocaleString(),
                unit: row.usage_unit
            }));
        } catch (geminiError) {
            console.error("Error fetching Gemini breakdown:", geminiError);
        }

        // 8. Query for Daily Trend (Last 60 Days)
        const dailyQuery = `
            SELECT
                FORMAT_DATE('%Y-%m-%d', DATE(usage_start_time)) as usage_date,
                SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) as net_cost
            FROM \`${fullTableName}\`
            WHERE usage_start_time >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY))
            GROUP BY 1
            ORDER BY 1 ASC
        `;

        let dailyTrend = [];
        try {
            const [dailyRows] = await bigquery.query({ query: dailyQuery, location: 'US' });
            dailyTrend = dailyRows.map(row => ({
                date: row.usage_date,
                amount: parseFloat(parseFloat(row.net_cost).toFixed(2))
            }));
        } catch (dailyError) {
            console.error("Error fetching daily trend:", dailyError);
        }

        return {
            amount: totalCost.toFixed(2),
            currencyCode: 'USD',
            lastUpdated: lastUpdated,
            status: 'success',
            breakdown: breakdown,
            history: history,
            previousMonthBreakdown: previousMonthBreakdown,
            geminiBreakdown: geminiBreakdown,
            dailyTrend: dailyTrend
        };
    }
    catch (error) {
        console.error("Error fetching billing cost from BigQuery:", error);

        if (error.code === 404 || error.message.includes('Not found')) {
            return {
                amount: 0,
                status: 'error_not_found',
                message: 'BigQuery dataset or table not found.',
                details: error.message
            };
        }

        if (error.code === 403 || error.message.includes('Permission denied')) {
            return {
                amount: 0,
                status: 'permission_denied',
                message: 'Missing BigQuery permissions (BigQuery Job User / Data Viewer).',
                details: error.message
            };
        }

        return {
            amount: 0,
            status: 'error',
            message: `BigQuery Error: ${error.message}`,
            details: error.toString()
        };
    }
}

module.exports = {
    getCurrentCost
};

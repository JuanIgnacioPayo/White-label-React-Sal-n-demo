async function go() {
    try {
        const res = await fetch("https://us-central1-melishare-redirect-payo.cloudfunctions.net/checkYearConfig", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: {} })
        });
        const json = await res.json();
        const data = json.result;
        console.log("y_ano1:", data.yearConfig?.y_ano1);
        console.log("z_ano2:", data.yearConfig?.z_ano2);
        console.log("Month 1 Price:", data.month1?.a_precio_4hs_);
        console.log("Month 13 Price:", data.month13?.a_precio_4hs_);
    } catch (e) {
        console.error(e);
    }
}
go();

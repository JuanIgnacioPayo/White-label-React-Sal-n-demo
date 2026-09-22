import styled from "styled-components";
import FormPrecios from './FormPrecios';
import GlobalPriceChart from './GlobalPriceChart';
import React, { useState, useEffect } from 'react';
import { app } from "../../firebase/firebase";
import { getDatabase, ref, get, set } from "firebase/database";
import { format } from 'date-fns';
import es from 'date-fns/locale/es';

function TogglesPrecios() {
    const [activeMonthsList, setActiveMonthsList] = useState([]);
    const [toggleState, setToggleState] = useState(null); // Will hold the bucket index (1-24)
    const [visibleStartIndex, setVisibleStartIndex] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            const db = getDatabase(app);
            const dbRef = ref(db, "datosId/26");
            const snapshot = await get(dbRef);
            let monthsList = [];
            
            if (snapshot.exists() && snapshot.val().activeMonthsList) {
                monthsList = snapshot.val().activeMonthsList;
            } else {
                // Initialize for backward compatibility (May 2026 to Jun 2027)
                monthsList = [
                    "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10",
                    "2026-11", "2026-12", "2027-01", "2027-02", "2027-03", "2027-04",
                    "2027-05", "2027-06"
                ];
                // Save it right away
                await updateFirebaseData(monthsList);
            }
            
            setActiveMonthsList(monthsList);
            
            // Calculate visible start index (hide past months)
            const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
            const currentIndex = monthsList.findIndex(m => m === currentMonthStr);
            const startIndex = currentIndex >= 0 ? currentIndex : 0;
            setVisibleStartIndex(startIndex);

            // Set first visible tab active by default
            if (monthsList.length > startIndex) {
                const firstVisibleBucket = getBucketForMonth(monthsList[startIndex]);
                setToggleState(firstVisibleBucket);
            } else if (monthsList.length > 0) {
                setToggleState(getBucketForMonth(monthsList[0]));
            }
        }
        fetchData();
    }, []);

    // Circular mapping logic: (Year * 12 + Month) % 24
    const getBucketForMonth = (yearMonthStr) => {
        const [yStr, mStr] = yearMonthStr.split('-');
        const y = parseInt(yStr, 10);
        const m = parseInt(mStr, 10);
        let bucket = (y * 12 + m) % 24;
        if (bucket === 0) bucket = 24;
        return bucket;
    };

    const updateFirebaseData = async (newList) => {
        const db = getDatabase(app);
        const dbRef = ref(db, "datosId/26");
        const snapshot = await get(dbRef);
        const existingData = snapshot.exists() ? snapshot.val() : {};

        let fechaFinal = "";
        let y_ano1 = existingData.y_ano1 || "2026";
        let z_ano2 = existingData.z_ano2 || "2026";

        if (newList.length > 0) {
            const lastMonthStr = newList[newList.length - 1];
            const [yStr, mStr] = lastMonthStr.split('-');
            const yearNum = parseInt(yStr, 10);
            const monthNumber = parseInt(mStr, 10);
            
            // El día 0 del mes siguiente nos da el último día del mes actual
            const lastDay = new Date(yearNum, monthNumber, 0);
            
            const yearForm = lastDay.getFullYear();
            const monthForm = String(lastDay.getMonth() + 1).padStart(2, '0');
            const dayForm = String(lastDay.getDate()).padStart(2, '0');
            fechaFinal = `${yearForm}-${monthForm}-${dayForm}`;

            const firstYear = parseInt(newList[0].split('-')[0], 10);
            const lastYear = yearNum;
            y_ano1 = firstYear.toString();
            if (lastYear > firstYear) {
                z_ano2 = lastYear.toString();
            } else {
                z_ano2 = firstYear.toString();
            }
        }

        await set(dbRef, {
            ...existingData,
            activeMonthsList: newList,
            fechaFinalCalendario: fechaFinal,
            y_ano1: y_ano1,
            z_ano2: z_ano2
        });
    };

    const handleAddMonth = () => {
        if (activeMonthsList.length === 0) return;
        
        const lastMonthStr = activeMonthsList[activeMonthsList.length - 1];
        const [yStr, mStr] = lastMonthStr.split('-');
        let y = parseInt(yStr, 10);
        let m = parseInt(mStr, 10);
        
        m++;
        if (m > 12) {
            m = 1;
            y++;
        }
        
        const newMonthStr = `${y}-${String(m).padStart(2, '0')}`;
        const newList = [...activeMonthsList, newMonthStr];
        
        setActiveMonthsList(newList);
        setToggleState(getBucketForMonth(newMonthStr)); 
        updateFirebaseData(newList);
    };

    const handleRemoveMonth = () => {
        if (activeMonthsList.length <= 1) return; // Don't remove the last remaining month
        
        const newList = activeMonthsList.slice(0, -1);
        setActiveMonthsList(newList);
        
        const newLast = newList[newList.length - 1];
        setToggleState(getBucketForMonth(newLast));
        updateFirebaseData(newList);
    };

    return (
        <Section>
            <div className="container">
                <div className="bloc-tabs">
                    <div className="months-container">
                        <ul className="header">
                            {visibleStartIndex > 0 && (
                                <li className="tabs" onClick={() => setVisibleStartIndex(v => v - 1)} title="Ver mes anterior">
                                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>&lsaquo;</span>
                                </li>
                            )}
                            {activeMonthsList.slice(visibleStartIndex).map((yearMonthStr) => {
                                const bucket = getBucketForMonth(yearMonthStr);
                                const [yStr, mStr] = yearMonthStr.split('-');
                                const dateObj = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1);
                                const displayName = format(dateObj, 'MMM yyyy', { locale: es }).toUpperCase();
                                
                                return (
                                    <li
                                        key={yearMonthStr}
                                        className={toggleState === bucket ? "tabs active-tabs" : "tabs"}
                                        onClick={() => setToggleState(bucket)}
                                    >
                                        {displayName}
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="action-buttons">
                            <button className="btn-add" onClick={handleAddMonth}>+ Agregar mes</button>
                            {activeMonthsList.length > 1 && (
                                <button className="btn-remove" onClick={handleRemoveMonth}>- Eliminar último</button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="content-tabs">
                    {activeMonthsList.map((yearMonthStr) => {
                        const bucket = getBucketForMonth(yearMonthStr);
                        const [yStr, mStr] = yearMonthStr.split('-');
                        const dateObj = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1);
                        const monthName = format(dateObj, 'MMMM', { locale: es });
                        const yearName = yStr;
                        
                        return (
                            <div key={bucket} className={toggleState === bucket ? "content active-content" : "content"}>
                                <div className="mes">
                                    <FormPrecios toggle={String(bucket)} monthString={yearMonthStr} title={`Precios ${monthName} ${yearName}`} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <GlobalPriceChart 
                    activeMonthsList={activeMonthsList.slice(0, 24)} 
                    getBucketForMonth={getBucketForMonth} 
                />
            </div>
        </Section>
    );
}

export default TogglesPrecios;

const Section = styled.section`
  max-width: 1000px;
  margin: 0 auto;
  padding: 0;

  .container {
    width: 100%;
    
    .bloc-tabs {
      background-color: #fafafa;
      padding: 1rem;
      border-radius: 16px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.02);

      .months-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .header {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        list-style: none;
        padding: 0;
        margin: 0;
        width: 100%;

        li.tabs {
          font-family: 'product_sansbold', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 10px 16px;
          text-align: center;
          cursor: pointer;
          border-radius: 10px;
          color: var(--secondary-text, #666);
          background-color: #e0e0e0;
          transition: all 0.2s ease-in-out;
          display: flex;
          justify-content: center;
          align-items: center;
          white-space: nowrap;

          &:hover {
            color: var(--primary-text);
            background-color: rgba(148, 137, 36, 0.2);
          }

          &.active-tabs {
            background-color: var(--primary-color, #948924);
            color: white;
            box-shadow: 0 4px 12px rgba(148, 137, 36, 0.25);
            transform: translateY(-1px);
          }
        }
      }

      .action-buttons {
        display: flex;
        gap: 1rem;
        margin-top: 0.5rem;
        
        button {
          font-family: 'product_sansbold', sans-serif;
          font-size: 0.85rem;
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add {
          background-color: var(--primary-color, #948924);
          color: white;
          
          &:hover {
            filter: brightness(1.1);
          }
        }

        .btn-remove {
          background-color: #f44336;
          color: white;
          
          &:hover {
            filter: brightness(1.1);
          }
        }
      }
    }
  }

  @media screen and (max-width: 768px) {
    padding: 0.5rem;

    .container {
      .bloc-tabs {
        padding: 0.8rem;
        
        .header li.tabs {
          font-size: 0.7rem;
          padding: 8px 12px;
          flex-grow: 1;
        }
        
        .action-buttons {
          flex-direction: column;
          button { width: 100%; }
        }
      }
    }
  }

  .content {
    display: none;
  }

  .active-content {
    display: block;
  }
`;

import { useState } from "react";
import styled from "styled-components";

import GestionFeriados from "../FormsYToggles/GestionFeriados";
import GestionCalendarios from "../FormsYToggles/GestionCalendarios";


import EventHeatmap from "../EventHeatmap";

export default function CalendariosAdmin() {
  const [toggleState, setToggleState] = useState(1);

  const toggleTab = (index) => {
    setToggleState(index);
  };

  return (
    <Section>
      <div className="container-cal">
        <div className="bloc-tabs-cal">
          <ul className="header3">
            <li
              key={1}
              className={toggleState === 1 ? "tabs-cal active-tabs-cal" : "tabs-cal"}
              onClick={() => toggleTab(1)}
            >
              Feriados
            </li>
            <li
              key={2}
              className={toggleState === 2 ? "tabs-cal active-tabs-cal" : "tabs-cal"}
              onClick={() => toggleTab(2)}
            >
              IDs de calendarios
            </li>
            <li
              key={3}
              className={toggleState === 3 ? "tabs-cal active-tabs-cal" : "tabs-cal"}
              onClick={() => toggleTab(3)}
            >
              Mapa de calor de horarios
            </li>
          </ul>
        </div>

        <div className="content-tabs-cal">
          <div
            className={toggleState === 1 ? "content-cal active-content-cal" : "content-cal"}
          >
            <GestionFeriados />
          </div>
          <div
            className={toggleState === 2 ? "content-cal active-content-cal" : "content-cal"}
          >
            <GestionCalendarios />
          </div>
          <div
            className={toggleState === 3 ? "content-cal active-content-cal" : "content-cal"}
          >
            <EventHeatmap />
          </div>
        </div>
      </div>
    </Section>
  );
}

const Section = styled.section`
  max-width: 1000px;
  margin: 0 auto;
  padding: 0;

  .container-cal {
    width: 100%;
    
    .bloc-tabs-cal {
      background-color: var(--card-grey, #fafafa);
      padding: 0.5rem;
      border-radius: 16px;
      border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px var(--shadow-color, rgba(0,0,0,0.02));
      /* Remove position fixed if we want it to flow naturally, or keep it if requested, but TogglesPrecios doesn't use fixed. */
    }

    .header3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      list-style: none;
      padding: 0;
      margin: 0;
      width: 100%;

      li.tabs-cal {
        font-family: 'product_sansregular', sans-serif;
        font-size: 0.8rem;
        font-weight: 700;
        padding: 12px 6px;
        text-align: center;
        cursor: pointer;
        border-radius: 10px;
        color: var(--secondary-text, #666);
        background-color: transparent;
        transition: all 0.2s ease-in-out;
        display: flex;
        justify-content: center;
        align-items: center;
        white-space: nowrap;

        &:hover {
          color: var(--primary-text);
          background-color: var(--hover-bg, rgba(148, 137, 36, 0.08));
        }

        &.active-tabs-cal {
          background-color: var(--primary-color, #948924);
          color: white;
          box-shadow: 0 4px 12px var(--shadow-color, rgba(148, 137, 36, 0.25));
          transform: translateY(-1px);
        }
      }
    }
  }

  .content-cal {
    display: none;
  }

  .active-content-cal {
    display: block;
  }

  @media screen and (min-width: 280px) and (max-width: 1080px) {
    padding: 0.5rem;

    .container-cal {
      .bloc-tabs-cal {
        padding: 0.4rem;
        border-radius: 12px;
        margin-bottom: 1.5rem;

        .header3 {
          grid-template-columns: repeat(2, 1fr); /* 2 columns on mobile/tablet */
          gap: 4px;

          li.tabs-cal {
            font-size: 0.75rem;
            padding: 10px 4px;
            border-radius: 8px;
          }
        }
      }
    }
  }

  @media screen and (max-width: 480px) {
    .container-cal {
      .bloc-tabs-cal {
        .header3 {
          grid-template-columns: repeat(1, 1fr); /* 1 column on very small screens or keep 2 */
        }
      }
    }
  }
`;
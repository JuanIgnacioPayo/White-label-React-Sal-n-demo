import React from 'react';
import { useLoading } from '../contexts/LoadingContext';

import styled from "styled-components";
import { useState, useEffect } from "react";
import { app } from "../firebase/firebase";
import { getDatabase, ref, get } from "firebase/database";
import { InputSwitch } from 'primereact/inputswitch';
import SEO from './SEO';
import { useSiteContext } from '../contexts/SiteContext';

export default function Calculadora() {
    const { completeTask } = useLoading();
    React.useEffect(() => { completeTask('app_init'); }, [completeTask]);

  const { siteName } = useSiteContext();

  let [precio_3hs, setprecio_3hs] = useState("");
  let [hora_extra_semana, sethora_extra_semana] = useState("");
  let [precio_4hs, setprecio_4hs] = useState("");
  let [hora_extra_finde, sethora_extra_finde] = useState("");
  let [camarera, setcamarera] = useState("");
  let [metegol, setmetegol] = useState("");
  let [inflable, setinflable] = useState("");
  let [pingpong, setpingpong] = useState("");
  let [arcade, setarcade] = useState("");
  let [proyector, setproyector] = useState("");
  let [hora_organizacion, sethora_organizacion] = useState("");
  let [parrillero, setparrillero] = useState("");
  let [suma_precios, setsuma_precios] = useState("");

  let [precio_3hs_check, setprecio_3hs_check] = useState("");
  let [hora_extra_semana_check, sethora_extra_semana_check] = useState("");
  let [precio_4hs_check, setprecio_4hs_check] = useState("");
  let [hora_extra_finder_check, sethora_extra_finde_check] = useState("");
  let [camarera_check, setcamarera_check] = useState("");
  let [metegol_check, setmetegol_check] = useState("");
  let [inflable_check, setinflable_check] = useState("");
  let [pingpong_check, setpingpong_check] = useState("");
  let [arcade_check, setarcade_check] = useState("");
  let [proyector_check, setproyector_check] = useState("");
  let [hora_organizacion_check, sethora_organizacion_check] = useState("");
  let [parrillero_check, setparrillero_check] = useState("");

  let [link_imagen_volver, setlink_imagen_volver] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 8;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        setprecio_3hs(targetObject.b_precio_3hs_);
        sethora_extra_semana(targetObject.d_hora_extra_semana_);
        setprecio_4hs(targetObject.a_precio_4hs_);
        sethora_extra_finde(targetObject.c_hora_extra_finde_);
        setcamarera(targetObject.e_camarera_);
        setmetegol(targetObject.f_metegol_);
        setinflable(targetObject.h_inflable_);
        setpingpong(targetObject.g_pingPong_);
        setarcade(targetObject.j_arcade_);
        setproyector(targetObject.i_proyector_);
        sethora_organizacion(targetObject.k_hora_organizacion_);
        setparrillero(targetObject.r_parrillero_);


      } else {
        console.log("error en precios")
      }
    }
    fetchData();
  }, [8])

  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase(app);
      let dbURL = "datosId/" + 25;
      const dbRef = ref(db, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();
        setlink_imagen_volver(targetObject.link_imagen_volver);
      } else {
        console.log("error en precios")
      }
    }
    fetchData();
  }, [25])




  return (
    <Section id="calculadora">
      <SEO
        title={`Calculadora - ${siteName}`}
        description={`Calculadora de precios de ${siteName}. Estimá el costo de tu evento de forma rápida y sencilla.`}
        url="/calculadora"
      />

      <h1>CALCULADORA</h1>

      <div className="checkLine">
        <InputSwitch className="check inline" checked={precio_3hs_check} onChange={(e) => setprecio_3hs_check(e.value)} />
        <p className="inline">Alquiler del salón x 3 hs</p>
      </div>

      <div className="checkLine">
        <InputSwitch
          className="check inline"
          checked={precio_4hs_check}
          onChange={(e) => setprecio_4hs_check(e.value)}
        />
        <p className="inline">Alquiler del salón x 4 hs</p>
      </div>

      <h1>Total: {suma_precios}</h1>

    </Section>
  );
};

const Section = styled.section`
  .inline{
  display: inline-block;
  }
  @media screen and (min-width: 280px) and (max-width: 1080px) {
  }
  `
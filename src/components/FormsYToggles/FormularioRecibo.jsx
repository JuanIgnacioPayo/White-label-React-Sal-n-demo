import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import styled from "styled-components";
import { ref, get, set, update, push, remove, onValue } from "firebase/database";
import { uploadToFirebaseStorage } from '../../utils/storageUpload';
import { app, storage, database } from "../../firebase/firebase";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext';
import Modal from '../Modal';
import defaultImage from '../../assets/ilustracion-joven-sonriente_1308-174669.jpg';
import { safeStorage } from '../../utils/safeStorage';






function FormularioRecibo({ isEmployeeFlow = false }) {

  const calculateSeniority = (startDate) => {
    if (!startDate) return "";
    const start = new Date(startDate);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years === 0 && months === 0) return "Menos de un mes";

    const yearStr = years > 0 ? `${years} año${years > 1 ? 's' : ''}` : "";
    const monthStr = months > 0 ? `${months} mes${months > 1 ? 'es' : ''}` : "";

    return [yearStr, monthStr].filter(Boolean).join(" y ");
  };

  const [dia, setDia] = useState("");
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState(new Date().getFullYear().toString().slice(-2));
  const [nombre, setNombre] = useState("");
  const [importe, setImporte] = useState("");
  const [importeTotal, setImporteTotal] = useState("");
  const [cuit, setCuit] = useState("");
  const [receiptModel, setReceiptModel] = useState(() => safeStorage.getItem('receiptModel') || 'clasico');
  const time = new Date();
  let [inputValue209, setInputValue209] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Estados para la calculadora de sueldos
  const [horasEvento, setHorasEvento] = useState("");
  const [cantidadVisitas, setCantidadVisitas] = useState("");
  const [limpiezas, setLimpiezas] = useState("");
  const [resultadoTotal, setResultadoTotal] = useState("");
  const [detalleTexto, setDetalleTexto] = useState("");
  const [valorHoraEvento, setValorHoraEvento] = useState("");
  const [valorVisita, setValorVisita] = useState("");
  const [valorLimpieza, setValorLimpieza] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [nombreEmpleado, setNombreEmpleado] = useState(""); 
  
  const [activeMonthsList, setActiveMonthsList] = useState([]);
  const [selectedCalculadoraMonth, setSelectedCalculadoraMonth] = useState("");

  // New states for time pickers
  const [startHour, setStartHour] = useState('');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('');
  const [endMinute, setEndMinute] = useState('00');

  const endHourRef = useRef(null);
  const startMinuteRef = useRef(null);
  const endMinuteRef = useRef(null);
  const valorHoraEventoRef = useRef(null);

  // Auto-fill event detection states
  const [todayEvents, setTodayEvents] = useState([]);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [autoFillApplied, setAutoFillApplied] = useState(false);
  const [autoFillExplanation, setAutoFillExplanation] = useState(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Helper: parse time string like "17:00", "17", "17.00" into { h, m }
  const parseTimeStr = (timeStr) => {
    if (!timeStr) return null;
    const match = String(timeStr).trim().match(/^(\d{1,2})(?:[:.h](\d{2}))?/);
    if (!match) return null;
    return { h: parseInt(match[1], 10), m: parseInt(match[2] || '0', 10) };
  };

  // Helper: subtract minutes from a time, returns { h, m }
  const subtractMinutes = (h, m, mins) => {
    let totalMins = h * 60 + m - mins;
    if (totalMins < 0) totalMins += 24 * 60; // wrap around midnight
    return { h: Math.floor(totalMins / 60) % 24, m: totalMins % 60 };
  };

  // Helper: add minutes to a time, returns { h, m }
  const addMinutes = (h, m, mins) => {
    let totalMins = h * 60 + m + mins;
    return { h: Math.floor(totalMins / 60) % 24, m: totalMins % 60 };
  };

  // Fetch today's presupuestos and auto-fill when in employee flow
  useEffect(() => {
    if (!isEmployeeFlow) return;

    const fetchTodayEvents = async () => {
      setLoadingEvents(true);
      try {
        const today = new Date();
        const year = today.getFullYear().toString();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');

        const todayRef = ref(database, `presupuestos/${year}/${month}/${day}`);
        const snapshot = await get(todayRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const events = Object.entries(data).map(([id, event]) => ({
            id,
            ...event,
            clientName: event.formData?.nombreCliente || 'Sin nombre',
            description: event.formData?.descripcionEvento || '',
            inicioEvento: event.formData?.inicioEvento || '',
            finEvento: event.formData?.finEvento || '',
          }));
          setTodayEvents(events);
          setSelectedEventIndex(0);
        } else {
          setTodayEvents([]);
        }
      } catch (error) {
        console.error('Error fetching today events:', error);
        setTodayEvents([]);
      }
      setLoadingEvents(false);
    };

    fetchTodayEvents();
  }, [isEmployeeFlow]);

  // Apply auto-fill when an event is selected
  useEffect(() => {
    if (!isEmployeeFlow || todayEvents.length === 0) return;

    const event = todayEvents[selectedEventIndex];
    if (!event) return;

    const inicio = parseTimeStr(event.inicioEvento);
    const fin = parseTimeStr(event.finEvento);

    if (!inicio || !fin) {
      setAutoFillExplanation({
        type: 'warning',
        message: `Evento de "${event.clientName}" no tiene horarios definidos en el presupuesto.`
      });
      return;
    }

    // Calculate event duration in minutes
    let durationMins = (fin.h * 60 + fin.m) - (inicio.h * 60 + inicio.m);
    if (durationMins <= 0) durationMins += 24 * 60; // overnight event
    const durationHours = durationMins / 60;

    // Determine prep time based on event duration
    let prepMins, prepLabel;
    if (durationHours >= 4) {
      prepMins = 120; // 2 hours
      prepLabel = '2h';
    } else {
      prepMins = 90; // 1.5 hours
      prepLabel = '1h 30min';
    }
    const closeMins = 60; // Always 1 hour after

    // Calculate coordination start and end
    const coordStart = subtractMinutes(inicio.h, inicio.m, prepMins);
    const coordEnd = addMinutes(fin.h, fin.m, closeMins);

    // Calculate total coordination hours
    let totalCoordMins = (coordEnd.h * 60 + coordEnd.m) - (coordStart.h * 60 + coordStart.m);
    if (totalCoordMins <= 0) totalCoordMins += 24 * 60;
    const totalCoordHours = totalCoordMins / 60;

    // Auto-fill the time fields
    setStartHour(coordStart.h.toString());
    setStartMinute(coordStart.m === 30 ? '30' : '00');
    setEndHour(coordEnd.h.toString());
    setEndMinute(coordEnd.m === 30 ? '30' : '00');
    setAutoFillApplied(true);

    // Format times for display
    const fmtTime = (h, m) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    setAutoFillExplanation({
      type: 'success',
      clientName: event.clientName,
      description: event.description,
      eventoInicio: fmtTime(inicio.h, inicio.m),
      eventoFin: fmtTime(fin.h, fin.m),
      durationHours: durationHours,
      prepLabel,
      coordInicio: fmtTime(coordStart.h, coordStart.m),
      coordFin: fmtTime(coordEnd.h, coordEnd.m),
      totalCoordHours: totalCoordHours,
      message: `Evento de ${durationHours}h (${fmtTime(inicio.h, inicio.m)} a ${fmtTime(fin.h, fin.m)}) → ${prepLabel} preparación + ${durationHours}h evento + 1h cierre = ${totalCoordHours}h coordinación total`
    });

  }, [isEmployeeFlow, todayEvents, selectedEventIndex]);

  // Update horaInicio when startHour or startMinute changes
  useEffect(() => {
    if (startHour !== '' && startMinute !== '') {
      setHoraInicio(`${startHour.toString().padStart(2, '0')}:${startMinute}`);
    } else {
      setHoraInicio('');
    }
  }, [startHour, startMinute]);

  // Update horaFin when endHour or endMinute changes
  useEffect(() => {
    if (endHour !== '' && endMinute !== '') {
      setHoraFin(`${endHour.toString().padStart(2, '0')}:${endMinute}`);
    } else {
      setHoraFin('');
    }
  }, [endHour, endMinute]);


  useEffect(() => {
    if (horaInicio && horaFin) {
      const inicio = new Date(`2000-01-01T${horaInicio}`);
      const fin = new Date(`2000-01-01T${horaFin}`);
      let diff = fin.getTime() - inicio.getTime();

      if (diff < 0) {
        // Si la hora de fin es menor que la de inicio, se asume que es del día siguiente
        const finDiaSiguiente = new Date(fin.getTime() + 24 * 60 * 60 * 1000);
        diff = finDiaSiguiente.getTime() - inicio.getTime();
      }

      let diffHoras = diff / (1000 * 60 * 60);
      // Round to the nearest quarter hour
      diffHoras = Math.round(diffHoras * 4) / 4;
      setHorasEvento(diffHoras.toFixed(2)); // Use toFixed(2) to show .00, .25, .50, .75
    } else {
      setHorasEvento('');
    }
  }, [horaInicio, horaFin]);

  // Fetch active months for the calculator dropdown
  useEffect(() => {
    const fetchMonths = async () => {
      const dbRef = ref(database, "datosId/26/activeMonthsList");
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const months = snapshot.val();
        setActiveMonthsList(months);
        if (months.length > 0) {
          // Select the first month by default or maybe find current month
          const currentMonthStr = new Date().toISOString().slice(0, 7); // YYYY-MM
          const match = months.find(m => m === currentMonthStr) || months[0];
          setSelectedCalculadoraMonth(match);
        }
      }
    };
    fetchMonths();
  }, []);

  // Fetch prices when selectedCalculadoraMonth changes
  useEffect(() => {
    if (!selectedCalculadoraMonth) return;
    const fetchPrices = async () => {
      const [yStr, mStr] = selectedCalculadoraMonth.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);
      let bucket = (y * 12 + m) % 24;
      if (bucket === 0) bucket = 24;

      const dbRef = ref(database, `datosId/${bucket}`);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        setValorHoraEvento(data.z_sueldo_hora_ || "");
        setValorLimpieza(data.z_sueldo_limpieza_ || "");
        setValorVisita(data.z_sueldo_visita_ || "");
      } else {
        // Clear if not found
        setValorHoraEvento("");
        setValorLimpieza("");
        setValorVisita("");
      }
    };
    fetchPrices();
  }, [selectedCalculadoraMonth]);

  // *** CHANGES START HERE ***
  // otrosGastos and otrosGastos2 will no longer read from localStorage
  const [otrosGastos, setOtrosGastos] = useState(""); // Removed localStorage.getItem
  const [descripcionOtrosGastos, setDescripcionOtrosGastos] = useState(""); // Removed localStorage.getItem
  const [descripcionOtrosGastos2, setDescripcionOtrosGastos2] = useState(""); // Removed localStorage.getItem
  const [otrosGastos2, setOtrosGastos2] = useState(""); // Removed localStorage.getItem
  // *** CHANGES END HERE ***


  // Employee Management State
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    nombreCompleto: '',
    nombreCorto: '',
    cuit: '',
    fechaIngreso: '',
    googleDriveFolderId: '',
    foto: null
  });
  const [uploadingEmployee, setUploadingEmployee] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);

  // Fetch Employees
  useEffect(() => {
    if (!currentUser) return; // Wait for authentication

    // Use the imported 'database' instance
    const employeesRef = ref(database, 'empleados');

    setLoadingEmployees(true);
    const unsubscribe = onValue(employeesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const employeesList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setEmployees(employeesList);
      } else {
        setEmployees([]);
      }
      setLoadingEmployees(false);
    }, (error) => {
      console.error("Error fetching employees:", error);
      setLoadingEmployees(false); // Ensure loading stops on error
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Validate selected employee when list changes
  useEffect(() => {
    if (employees.length > 0) {
      const found = employees.find(e => e.nombreCorto === nombreEmpleado);
      if (!found) {
        // If current selection is invalid, select the first employee
        setNombreEmpleado(employees[0].nombreCorto);
      }
    }
  }, [employees, nombreEmpleado]);

  const handleEmployeeSelection = (e) => {
    const value = e.target.value;
    if (value === "ADD_NEW") {
      navigate('/empleado/editar'); // Navigate to new employee page
    } else {
      setNombreEmpleado(value);
    }
  };

  const handleAddEmployeeChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'foto') {
      setNewEmployee(prev => ({ ...prev, foto: files[0] }));
    } else if (name === 'googleDriveFolderId') {
      // Try to extract ID if it looks like a URL
      let cleanId = value;
      if (value.includes('drive.google.com')) {
        const match = value.match(/folders\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          cleanId = match[1];
        }
      }
      setNewEmployee(prev => ({ ...prev, [name]: cleanId }));
    } else {
      setNewEmployee(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditEmployee = () => {
    const employeeToEdit = employees.find(e => e.nombreCorto === nombreEmpleado);
    if (!employeeToEdit) return;

    // Navigate to edit page with employee ID
    navigate(`/empleado/editar?id=${employeeToEdit.id}`);
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!newEmployee.nombreCorto || !newEmployee.nombreCompleto) {
      alert("Por favor complete los nombres.");
      return;
    }

    setUploadingEmployee(true);
    // Use imported database
    const employeesRef = ref(database, 'empleados');

    try {
      let photoURL = '';

      // If editing and no new photo, keep existing URL
      if (isEditMode) {
        const existingEmployee = employees.find(e => e.id === editingEmployeeId);
        photoURL = existingEmployee.fotoURL;
      }

      // If new photo is uploaded, process it
      if (newEmployee.foto) {
        photoURL = await uploadToFirebaseStorage(newEmployee.foto);
      } else if (!isEditMode) {
        // Only use default image if creating new and no photo provided
        const response = await fetch(defaultImage);
        const blob = await response.blob();
        const fileToUpload = new File([blob], "default.jpg", { type: "image/jpeg" });
        photoURL = await uploadToFirebaseStorage(fileToUpload);
      }

      const employeeData = {
        nombreCompleto: newEmployee.nombreCompleto,
        nombreCorto: newEmployee.nombreCorto,
        cuit: newEmployee.cuit,
        fechaIngreso: newEmployee.fechaIngreso,
        googleDriveFolderId: newEmployee.googleDriveFolderId,
        fotoURL: photoURL,
      };

      if (isEditMode) {
        // Update existing employee
        const employeeRef = ref(database, `empleados/${editingEmployeeId}`);
        await update(employeeRef, employeeData);
        alert("Empleado actualizado exitosamente!");
      } else {
        // Create new employee
        await push(employeesRef, {
          ...employeeData,
          fechaCreacion: new Date().toISOString()
        });
        alert("Empleado creado exitosamente!");
      }

      setIsAddEmployeeModalOpen(false);
      setNewEmployee({ nombreCompleto: '', nombreCorto: '', cuit: '', fechaIngreso: '', googleDriveFolderId: '', foto: null });
      setIsEditMode(false);
      setEditingEmployeeId(null);
    } catch (error) {
      console.error("Error saving employee:", error);
      alert("Error al guardar empleado: " + error.message);
    } finally {
      setUploadingEmployee(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!nombreEmpleado) return;

    const employeeToDelete = employees.find(e => e.nombreCorto === nombreEmpleado);
    if (!employeeToDelete) return;

    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${employeeToDelete.nombreCorto}? Esta acción no se puede deshacer.`)) {
      try {
        const dbRef = ref(database, `empleados/${employeeToDelete.id}`);
        await remove(dbRef);
        await remove(dbRef);

        // Reset states
        setNombreEmpleado("");
        setIsEditModalOpen(false); // Close modal if open
        setIsAddEmployeeModalOpen(false); // Ensure this one is closed too if used for edit
        setIsEditMode(false);
        setEditingEmployeeId(null);

        alert("Empleado eliminado correctamente.");
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert("Error al eliminar empleado: " + error.message);
      }
    }
  };






  const formatAnio = (anioIngresado) => {
    if (parseInt(anioIngresado) > 100) {
      return anioIngresado;
    }
    else {
      return parseInt(anioIngresado) + 2000;
    }
  }

  const capitalizeEachWord = (str) => {
    if (!str) return '';
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };


  const overwriteData = async () => {
    console.log("1 - FORMULARIORECIBO - Guardando datos en la base de datos (Metodo overwriteData)");
    let dbURL = "datosId/" + 31;
    // Use imported database
    const newDocRef = ref(database, dbURL);
    const nombreArchivo = `${dia}-${mes}-${formatAnio(anio)}`;

    return set(newDocRef, {
      dia_evento: dia,
      mes_evento: mes,
      anio_evento: formatAnio(anio),
      nombre_cliente: nombre,
      seña: importe,
      seña_total: importeTotal,
      nombre_del_archivo: nombreArchivo,
      cuit: cuit,
      fecha_creacion: time,
    }).catch((error) => {
        alert("error en FormRecibo ", error.message);
        throw error;
    });

  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Guardar datos en la base de datos
      await overwriteData();

      const targetRoute = receiptModel === 'infografico' ? '/templateReciboInfografia' : '/templateRecibo';
      console.log(`FORMULARIORECIBO - abriendo recibo (${receiptModel}):`, targetRoute);
      window.open(targetRoute, '_blank', 'noopener');
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const calcularPago = () => {
    // Guardar valores en localStorage for persistent fields
    safeStorage.setItem('valorHoraEvento', valorHoraEvento);
    safeStorage.setItem('valorVisita', valorVisita);
    safeStorage.setItem('valorLimpieza', valorLimpieza);
    safeStorage.setItem('nombreEmpleadoSueldo', nombreEmpleado); // Save employee name preference

    // *** CHANGES START HERE ***
    // Removed localStorage.setItem for otrosGastos and descripcionOtrosGastos
    // localStorage.setItem('otrosGastos', otrosGastos);
    // localStorage.setItem('otrosGastos2', otrosGastos2);
    // localStorage.setItem('descripcionOtrosGastos', descripcionOtrosGastos);
    // localStorage.setItem('descripcionOtrosGastos2', descripcionOtrosGastos2);
    // *** CHANGES END HERE ***

    let total = 0;
    let detalle = "";

    const eventoTotal = (parseFloat(horasEvento) || 0) * (parseFloat(valorHoraEvento) || 0);
    if (eventoTotal > 0) {
      total += eventoTotal;
      detalle += `
Horas de coordinación de ${horaInicio} a ${horaFin} (${horasEvento}hs) = $${eventoTotal}`;
    }

    const visitasTotal = (parseFloat(cantidadVisitas) || 0) * (parseFloat(valorVisita) || 0);
    if (visitasTotal > 0) {
      total += visitasTotal;
      detalle += `\nVisitas ${cantidadVisitas} x $${valorVisita} = $${visitasTotal}`;
    }

    const limpiezaTotal = (parseFloat(limpiezas) || 0) * (parseFloat(valorLimpieza) || 0);
    if (limpiezaTotal > 0) {
      total += limpiezaTotal;
      detalle += `\nLimpiezas ${limpiezas} x $${valorLimpieza} = $${limpiezaTotal}`;
    }

    const otros1 = parseFloat(otrosGastos) || 0;
    if (otros1 > 0) {
      total += otros1;
      detalle += `\n${descripcionOtrosGastos || "Otros gastos"} = ${otros1}`;
    }

    const otros2 = parseFloat(otrosGastos2) || 0;
    if (otros2 > 0) {
      total += otros2;
      detalle += `
${descripcionOtrosGastos2 || "Otros gastos 2"} = ${otros2}`;
    }

    detalle += `\nTotal = $${total}`;

    setResultadoTotal(total);
    setDetalleTexto(detalle);
    navigator.clipboard.writeText(detalle);
    toast.success(
      <div style={{ whiteSpace: 'pre-line', textAlign: 'left' }}>
        {detalle}
        <div style={{ fontSize: '0.8rem', fontStyle: 'italic', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '0.3rem' }}>
          ✓ Copiado al portapapeles
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      }
    );

    // Save to history automatically when calculating? Or separate button?
    // Let's make it a separate action or part of the "Calcular" if the user wants. 
    // For now, I'll add a separate automatic save or a function to be called.
    saveToHistory(total, {
      horas_cantidad: horasEvento,
      horas_valor: valorHoraEvento,
      visitas_cantidad: cantidadVisitas,
      visitas_valor: valorVisita,
      limpieza_cantidad: limpiezas,
      limpieza_valor: valorLimpieza,
      otros_gastos: (parseFloat(otrosGastos) || 0) + (parseFloat(otrosGastos2) || 0),
      otros_gastos_monto: parseFloat(otrosGastos) || 0,
      otros_gastos_desc: descripcionOtrosGastos,
      otros_gastos2_monto: parseFloat(otrosGastos2) || 0,
      otros_gastos2_desc: descripcionOtrosGastos2
    });
  };

  const saveToHistory = (total, detalles) => {
    if (!currentUser) return; // Only save if logged in

    // Use imported database
    const historyRef = ref(database, 'sueldos_historial');

    const newRecord = {
      fecha_carga: new Date().toISOString(),
      empleado: nombreEmpleado,
      total: total,
      detalles: detalles,
      creado_por: currentUser.email
    };

    push(historyRef, newRecord)
      .then(() => {
        // Optional: show toast or indicator
        console.log("Historial guardado exitosamente");
      })
      .catch((error) => {
        console.error("Error al guardar historial:", error);
      });
  };






  useEffect(() => {
    const fetchData = async () => {
      // Use imported database
      let dbURL = "datosId/" + 25;
      const dbRef = ref(database, dbURL);
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const targetObject = snapshot.val();


        setInputValue209(targetObject.link_imagen_volver);



      }
    }
    fetchData();
  }, [25])

  useEffect(() => {
    const handleKeyPress = (evt) => {
      if (evt.key !== 'Enter') {
        return;
      }
      let element = evt.target;
      if (!element.classList.contains('focusNext')) {
        return;
      }
      let tabIndex = element.tabIndex + 1;
      var next = document.querySelector(`[tabIndex="${tabIndex}"]`);
      if (next) {
        next.focus();
        evt.preventDefault();
      }
    };

    document.addEventListener('keypress', handleKeyPress);

    return () => {
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const handleStartHourChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = "";
    else if (val < 0) val = 0;
    else if (val > 23) val = 23;
    setStartHour(val.toString());
  };

  const handleStartMinuteToggle = () => {
    setStartMinute(prev => prev === '00' ? '30' : '00');
    if (endHourRef.current) {
      endHourRef.current.focus();
    }
  };

  const handleEndHourChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = "";
    else if (val < 0) val = 0;
    else if (val > 23) val = 23;
    setEndHour(val.toString());
  };

  const handleEndMinuteToggle = () => {
    setEndMinute(prev => prev === '00' ? '30' : '00');
    if (valorHoraEventoRef.current) {
      valorHoraEventoRef.current.focus();
    }
  };


  return (
    <FormWrapper>
      {isEmployeeFlow && (
        <>
          <div className="card">
            <div className="form-group" style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1.5rem', width: '100%', maxWidth: '100%' }}>
              <div className="employee-carousel-container" style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '15px',
                padding: '10px 0 20px 0', // added bottom padding for scrollbar
                margin: '0',
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin' // Allow scrollbar on Firefox
              }}>
                <style>{`
                  .employee-carousel-container::-webkit-scrollbar { 
                      height: 8px; 
                  }
                  .employee-carousel-container::-webkit-scrollbar-track {
                      background: rgba(0,0,0,0.03); 
                      border-radius: 4px;
                  }
                  .employee-carousel-container::-webkit-scrollbar-thumb {
                      background: rgba(0,0,0,0.15); 
                      border-radius: 4px;
                  }
                  .employee-carousel-container::-webkit-scrollbar-thumb:hover {
                      background: rgba(0,0,0,0.25); 
                  }
                `}</style>
                {loadingEmployees && <p>Cargando empleadas...</p>}
                {!loadingEmployees && employees.length === 0 && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(162, 107, 250, 0.08)',
                    borderLeft: '4px solid var(--primary-color, #a26bfa)',
                    color: '#444', fontSize: '0.9rem', lineHeight: '1.4', textAlign: 'left', minWidth: '100%'
                  }}>
                    <strong>💡 ¿No ves a tus empleadas?</strong> Debido a la reciente migración del sitio, los datos de los empleados deben ser cargados por única vez en la nueva base de datos. 
                    {" "}<a href="/empleado/editar" style={{
                      color: 'var(--primary-color, #a26bfa)', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer'
                    }}>Haz clic aquí para agregar una empleada</a> en el nuevo sistema.
                  </div>
                )}
                {!loadingEmployees && employees.map(emp => {
                  const isSelected = emp.nombreCorto === nombreEmpleado;
                  return (
                    <EmployeeProfileCard 
                      key={emp.id}
                      style={{ 
                        flex: '0 0 auto',
                        width: '75vw',
                        maxWidth: '220px',
                        scrollSnapAlign: 'start',
                        margin: 0, 
                        opacity: isSelected ? 1 : 0.6,
                        border: isSelected ? '2px solid var(--primary-color, #a26bfa)' : '1px solid rgba(0,0,0,0.05)',
                        boxShadow: 'none',
                        transform: 'none',
                        transition: 'opacity 0.3s ease, border 0.3s ease'
                      }}
                      onClick={() => setNombreEmpleado(emp.nombreCorto)}
                    >
                      {emp.fotoURL && (
                        <div className="profile-img-container">
                          <img src={emp.fotoURL} alt="Foto de perfil" />
                        </div>
                      )}
                      <div className="profile-info">
                        <span className="profile-name">{emp.nombreCompleto}</span>
                        {emp.cuit && <span className="profile-cuit">CUIT: {emp.cuit}</span>}
                        {emp.fechaIngreso && (
                          <span className="profile-seniority">
                            Antigüedad: {calculateSeniority(emp.fechaIngreso)}
                          </span>
                        )}
                      </div>
                      <div className="profile-edit-icon" onClick={(e) => { e.stopPropagation(); navigate('/empleado/editar?id=' + emp.id); }}>
                        ✎
                      </div>
                    </EmployeeProfileCard>
                  );
                })}
                {!loadingEmployees && employees.length > 0 && (
                  <div 
                    style={{ 
                      flex: '0 0 auto',
                      width: '200px', 
                      scrollSnapAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      border: '2px dashed #ccc',
                      borderRadius: '12px',
                      background: '#fafafa',
                      color: 'var(--primary-color, #a26bfa)',
                      fontWeight: 'bold',
                      padding: '20px',
                      opacity: 0.8
                    }}
                    onClick={() => navigate('/empleado/editar')}
                  >
                    + Agregar Empleada
                  </div>
                )}
              </div>
              {(() => {
                const employeeToEdit = employees.find(e => e.nombreCorto === nombreEmpleado);
                return employeeToEdit && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                  <button 
                    type="button"
                    onClick={() => navigate('/empleado/editar?id=' + employeeToEdit.id)}
                    style={{
                      padding: '8px 16px',
                      background: 'white',
                      border: '1px solid var(--primary-color, #a26bfa)',
                      color: 'var(--primary-color, #a26bfa)',
                      borderRadius: '20px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>Ir al dashboard de {employeeToEdit.nombreCorto}</span>
                    <span>✨</span>
                  </button>
                </div>
              );
              })()}
            </div>

            {/* Auto-fill Banner */}
            {isEmployeeFlow && (
              <div style={{ marginBottom: '1.5rem' }}>
                {loadingEvents ? (
                  <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px', color: '#666', fontSize: '0.9rem', textAlign: 'center' }}>
                    Buscando eventos de hoy...
                  </div>
                ) : todayEvents.length > 0 ? (
                  <div style={{ 
                    padding: '16px', 
                    background: autoFillExplanation?.type === 'warning' ? '#fff3cd' : '#e8f5e9', 
                    border: autoFillExplanation?.type === 'warning' ? '1px solid #ffe69c' : '1px solid #c3e6cb',
                    borderRadius: '12px',
                    color: autoFillExplanation?.type === 'warning' ? '#856404' : '#155724'
                  }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '1.1rem' }}>
                        📅 {autoFillExplanation?.clientName}
                      </strong>
                      {autoFillExplanation?.type === 'success' && (
                        <span style={{ fontSize: '0.95rem' }}>
                          — <span style={{ fontWeight: 500 }}>Evento:</span> {autoFillExplanation.eventoInicio} a {autoFillExplanation.eventoFin} ({autoFillExplanation.durationHours}h)
                        </span>
                      )}
                      <div style={{ marginLeft: 'auto' }}>
                        {todayEvents.length > 1 && (
                          <select 
                            value={selectedEventIndex} 
                            onChange={(e) => setSelectedEventIndex(Number(e.target.value))}
                            style={{ 
                              padding: '4px 8px', 
                              borderRadius: '6px', 
                              border: '1px solid #ccc',
                              background: '#fff'
                            }}
                          >
                            {todayEvents.map((ev, idx) => (
                              <option key={ev.id} value={idx}>{ev.clientName} ({ev.inicioEvento || '?'} - {ev.finEvento || '?'})</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                    
                    {autoFillExplanation?.type === 'success' ? (
                      <>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.85rem', color: '#2c663b', background: '#d4edda', padding: '8px 12px', borderRadius: '6px', flex: '1 1 auto' }}>
                            ✓ Se auto-completó coordinación: <strong>{autoFillExplanation.prepLabel}</strong> prep. + <strong>{autoFillExplanation.durationHours}h</strong> evento + <strong>1h</strong> cierre = <strong>{autoFillExplanation.totalCoordHours}h</strong> totales
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setStartHour('');
                              setStartMinute('00');
                              setEndHour('');
                              setEndMinute('00');
                              setAutoFillApplied(false);
                            }}
                            style={{
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              fontWeight: 500,
                              height: 'fit-content'
                            }}
                          >
                            ✖ Borrar horas
                          </button>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '0.9rem' }}>{autoFillExplanation?.message}</div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '12px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', color: '#6c757d', fontSize: '0.9rem', textAlign: 'center' }}>
                    No hay eventos agendados para hoy.
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <div className="flat-row" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: '15px' }}>
                <TimePickerWrapper style={{ marginBottom: 0 }}>
                  <span>Desde</span>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={startHour}
                    onChange={handleStartHourChange}
                    placeholder="HH"
                    tabIndex="1"
                    className="focusNext time-input"
                  />
                  <span>:</span>
                  <button
                    onClick={handleStartMinuteToggle}
                    className="minute-toggle"
                    tabIndex="2"
                  >
                    {startMinute}m
                  </button>
                </TimePickerWrapper>
                <TimePickerWrapper style={{ marginBottom: 0 }}>
                  <span>Hasta</span>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={endHour}
                    onChange={handleEndHourChange}
                    placeholder="HH"
                    ref={endHourRef}
                    tabIndex="3"
                    className="focusNext time-input"
                  />
                  <span>:</span>
                  <button
                    onClick={handleEndMinuteToggle}
                    className="minute-toggle"
                    tabIndex="4"
                  >
                    {endMinute}m
                  </button>
                </TimePickerWrapper>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto', minWidth: '120px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary-text)' }}>$</span>
                  <input type="number" ref={valorHoraEventoRef} value={valorHoraEvento} onChange={(e) => setValorHoraEvento(e.target.value)} placeholder="Valor por hora" tabIndex="5" className="focusNext linkUtilInput2" style={{ flex: 1, margin: 0 }} />
                </div>
              </div>
              <div className="flat-row" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', flex: '1 1 auto', minWidth: '200px' }}>
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setLimpiezas(limpiezas === String(num) ? '' : String(num))}
                      style={{
                        flex: 1,
                        padding: '12px 4px',
                        borderRadius: '12px',
                        border: limpiezas === String(num) ? '2px solid var(--primary-color, #a26bfa)' : '1px solid #ccc',
                        background: limpiezas === String(num) ? 'rgba(162, 107, 250, 0.1)' : '#fff',
                        color: limpiezas === String(num) ? 'var(--primary-color, #a26bfa)' : '#666',
                        fontWeight: limpiezas === String(num) ? 'bold' : 'normal',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '0.9rem'
                      }}
                    >
                      {num === 1 ? '1 limpieza' : `${num} limpiezas`}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto', width: '120px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary-text)' }}>$</span>
                  <input type="number" value={valorLimpieza} onChange={(e) => setValorLimpieza(e.target.value)} placeholder="Valor Limpieza" tabIndex="9" className="focusNext linkUtilInput2" style={{ flex: 1, margin: 0 }} />
                </div>
              </div>
              <div className="flat-row" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', flex: '1 1 auto', minWidth: '200px' }}>
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCantidadVisitas(cantidadVisitas === String(num) ? '' : String(num))}
                      style={{
                        flex: 1,
                        padding: '12px 4px',
                        borderRadius: '12px',
                        border: cantidadVisitas === String(num) ? '2px solid var(--primary-color, #a26bfa)' : '1px solid #ccc',
                        background: cantidadVisitas === String(num) ? 'rgba(162, 107, 250, 0.1)' : '#fff',
                        color: cantidadVisitas === String(num) ? 'var(--primary-color, #a26bfa)' : '#666',
                        fontWeight: cantidadVisitas === String(num) ? 'bold' : 'normal',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '0.9rem'
                      }}
                    >
                      {num === 1 ? '1 visita' : `${num} visitas`}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto', width: '120px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary-text)' }}>$</span>
                  <input type="number" value={valorVisita} onChange={(e) => setValorVisita(e.target.value)} placeholder="Valor Visita" tabIndex="7" className="focusNext linkUtilInput2" style={{ flex: 1, margin: 0 }} />
                </div>
              </div>
              <div className="flat-row" style={{ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: '15px' }}>
                <input type="text" value={descripcionOtrosGastos} onChange={(e) => setDescripcionOtrosGastos(e.target.value)} placeholder="Otros Gastos" tabIndex="10" className="focusNext linkUtilInput2" style={{ flex: '1 1 auto', minWidth: '0' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto', width: '120px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary-text)' }}>$</span>
                  <input type="number" value={otrosGastos} onChange={(e) => setOtrosGastos(e.target.value)} placeholder="Monto" tabIndex="11" className="focusNext linkUtilInput2" style={{ flex: 1, margin: 0, minWidth: '0' }} />
                </div>
              </div>
              <div className="flat-row" style={{ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: '15px' }}>
                <input type="text" value={descripcionOtrosGastos2} onChange={(e) => setDescripcionOtrosGastos2(e.target.value)} placeholder="Otros Gastos 2" tabIndex="12" className="focusNext linkUtilInput2" style={{ flex: '1 1 auto', minWidth: '0' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto', width: '120px' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary-text)' }}>$</span>
                  <input type="number" value={otrosGastos2} onChange={(e) => setOtrosGastos2(e.target.value)} placeholder="Monto" tabIndex="13" className="focusNext linkUtilInput2" style={{ flex: 1, margin: 0, minWidth: '0' }} />
                </div>
              </div>
              {resultadoTotal !== "" && (
                <div className="total-result" style={{ display: 'none' }}>
                  <h3>Total: ${resultadoTotal}</h3>
                  <p>El detalle ha sido copiado al portapapeles.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      {!isEmployeeFlow && (
        <div className="card">
          <h2>Generar Recibo</h2>
          <div className="form-group receipt-grid">
            <div className="receipt-col">
              <label>Fecha</label>
              <div className="date-row">
                <input tabIndex="15" className="focusNext linkUtilInput" type='text' value={dia} placeholder="DD" onChange={(e) => setDia(e.target.value)} />
                <input tabIndex="16" className="focusNext linkUtilInput" type='text' value={mes} placeholder="MM" onChange={(e) => setMes(e.target.value)} />
                <input tabIndex="17" className="focusNext linkUtilInput" type='text' value={anio} placeholder="YYYY" onChange={(e) => setAnio(e.target.value)} />
              </div>
            </div>
            <div className="receipt-col">
              <label>Cliente</label>
              <input tabIndex="18" className="focusNext linkUtilInput" type='text' value={nombre} placeholder="Nombre cliente" onChange={(e) => setNombre(capitalizeEachWord(e.target.value))} />
            </div>
            <div className="receipt-col">
              <label>CUIT / DNI</label>
              <input tabIndex="21" className="focusNext linkUtilInput" type='text' value={cuit} placeholder="CUIT/DNI (Opcional)" onChange={(e) => setCuit(e.target.value)} />
            </div>
            <div className="receipt-col">
              <label>Importe Seña</label>
              <input tabIndex="19" className="focusNext linkUtilInput" type='text' value={importe} placeholder="$ Seña" onChange={(e) => setImporte(e.target.value)} />
            </div>
            <div className="receipt-col">
              <label>Importe Total</label>
              <input tabIndex="20" className="focusNext linkUtilInput" type='text' value={importeTotal} placeholder="$ Total" onChange={(e) => setImporteTotal(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '0.6rem' }}>
              Diseño de Recibo:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  setReceiptModel('clasico');
                  safeStorage.setItem('receiptModel', 'clasico');
                }}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: receiptModel === 'clasico' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: receiptModel === 'clasico' ? '#eff6ff' : '#ffffff',
                  color: receiptModel === 'clasico' ? '#1d4ed8' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>📄</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Recibo Clásico</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>1 hoja · Formato Oficio</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setReceiptModel('infografico');
                  safeStorage.setItem('receiptModel', 'infografico');
                }}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  border: receiptModel === 'infografico' ? '2px solid #059669' : '1px solid #cbd5e1',
                  background: receiptModel === 'infografico' ? '#ecfdf5' : '#ffffff',
                  color: receiptModel === 'infografico' ? '#047857' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>📊</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Recibo Infográfico</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>2 hojas A4 · Estilo Infografía</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      <FloatingButtonContainer>
        {isEmployeeFlow && (
          <button className="boton btn-secondary" onClick={() => navigate('/admin')} tabIndex="23" style={{ background: '#6c757d', color: 'white' }}>
            Volver a Admin
          </button>
        )}
        {/* Dashboard buttons removed as per user request */}
        {isEmployeeFlow && (
          <button className="boton btn-primary" onClick={calcularPago} tabIndex="14" >Calcular y Copiar</button>
        )}
        {!isEmployeeFlow && (
          <button className="boton btn-success" tabIndex="22" onClick={handleSubmit}>
            Crear Recibo {receiptModel === 'infografico' ? '(Infografía)' : '(Clásico)'}
          </button>
        )}
      </FloatingButtonContainer>

      <Modal isOpen={isAddEmployeeModalOpen} onClose={() => { setIsAddEmployeeModalOpen(false); setIsEditMode(false); setNewEmployee({ nombreCompleto: '', nombreCorto: '', cuit: '', fechaIngreso: '', foto: null }); }}>
        <h3>{isEditMode ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}</h3>
        <form onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          <div>
            <label>Nombre Corto (para el menú)</label>
            <input
              name="nombreCorto"
              value={newEmployee.nombreCorto}
              onChange={handleAddEmployeeChange}
              placeholder="Ej: Lorena"
              required
            />
          </div>
          <div>
            <label>Nombre Completo</label>
            <input
              name="nombreCompleto"
              value={newEmployee.nombreCompleto}
              onChange={handleAddEmployeeChange}
              placeholder="Ej: Lorena Perez"
              required
            />
          </div>
          <div>
            <label>CUIT</label>
            <input
              name="cuit"
              value={newEmployee.cuit}
              onChange={handleAddEmployeeChange}
              placeholder="27-12345678-9"
            />
          </div>
          <div>
            <label>ID Carpeta Drive</label>
            <input
              name="googleDriveFolderId"
              value={newEmployee.googleDriveFolderId}
              onChange={handleAddEmployeeChange}
              placeholder="Ej: 1wymjfH..."
            />
          </div>
          <div>
            <label>Fecha de Ingreso</label>
            <input
              type="date"
              name="fechaIngreso"
              value={newEmployee.fechaIngreso}
              onChange={handleAddEmployeeChange}
            />
          </div>
          <div>
            <label>Foto</label>
            <input
              type="file"
              name="foto"
              accept="image/*"
              onChange={handleAddEmployeeChange}
            />
          </div>


          <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
            <button
              type="button"
              className="boton"
              onClick={() => { setIsAddEmployeeModalOpen(false); setIsEditMode(false); setNewEmployee({ nombreCompleto: '', nombreCorto: '', cuit: '', fechaIngreso: '', googleDriveFolderId: '', foto: null }); }}
              style={{ flex: 1, backgroundColor: '#6c757d' }}
              disabled={uploadingEmployee}
            >
              Cancelar
            </button>
            <button type="submit" className="boton" disabled={uploadingEmployee} style={{ flex: 1 }}>
              {uploadingEmployee ? (isEditMode ? 'Guardando...' : 'Creando...') : (isEditMode ? 'Guardar Cambios' : 'Crear Empleado')}
            </button>
          </div>

          {isEditMode && (
            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color, #eee)', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={handleDeleteEmployee}
                className="boton"
                style={{ backgroundColor: '#dc3545', width: '100%', fontSize: '0.9rem' }}
              >
                Eliminar Empleado
              </button>
            </div>
          )}
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <p>Usted está ingresando al modo de edición.</p>
      </Modal>
    </FormWrapper >
  );
}

export default FormularioRecibo;

const TimePickerWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;

  span {
    font-weight: 700;
    color: var(--secondary-text, #666);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  @media (max-width: 480px) {
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  select, input.time-input {
    font-family: 'product_sansregular', sans-serif;
    font-size: 1rem;
    padding: 0.6rem 0.8rem;
    border-radius: 10px;
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
    background-color: var(--input-bg, #fafafa);
    color: var(--primary-text);
    width: 80px;
    text-align: center;
    transition: all 0.3s ease;
    box-shadow: inset 0 2px 4px var(--shadow-color, rgba(0,0,0,0.02));

    &:focus {
      border-color: var(--primary-color, #948924);
      background-color: var(--input-bg, white);
      color: var(--primary-text);
      box-shadow: 0 0 0 3px rgba(148, 137, 36, 0.15);
      outline: none;
    }
  }

  button.minute-toggle {
    font-family: 'product_sansregular', sans-serif;
    font-size: 0.95rem;
    padding: 0.6rem 1rem;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background: linear-gradient(145deg, #f0f0f0, #e6e6e6);
    color: var(--primary-text);
    cursor: pointer;
    min-width: 65px;
    font-weight: bold;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);

    &:hover {
      background: linear-gradient(145deg, #e6e6e6, #d9d9d9);
      transform: translateY(-1px);
    }
    
    &:active {
      transform: translateY(1px);
    }
  }
`;

const EmployeeProfileCard = styled.div`
  margin-top: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  cursor: pointer;
  padding: 1.25rem;
  border-radius: 16px;
  background: var(--card-grey, linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(245, 246, 248, 0.9)));
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
  box-shadow: 0 10px 25px var(--shadow-color, rgba(0, 0, 0, 0.02));
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: var(--primary-color, #948924);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    background: var(--hover-bg, linear-gradient(135deg, #ffffff, #f1f3f5));
    border-color: var(--primary-color, #948924);
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);

    &::after {
      opacity: 1;
    }

    .profile-edit-icon {
      color: var(--primary-color, #948924);
      transform: scale(1.15) rotate(15deg);
    }
  }

  .profile-img-container {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    padding: 3px;
    background: linear-gradient(135deg, var(--primary-color, #948924) 0%, #ffc107 100%);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid white;
    }
  }

  .profile-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
  }

  .profile-name {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--primary-text);
  }

  .profile-cuit {
    font-size: 0.85rem;
    color: var(--secondary-text, #666);
  }

  .profile-seniority {
    font-size: 0.85rem;
    font-weight: 600;
    color: #2e7d32;
    background: rgba(46, 125, 50, 0.08);
    padding: 2px 8px;
    border-radius: 6px;
    width: fit-content;
    margin-top: 2px;
  }

  .profile-edit-icon {
    font-size: 1.2rem;
    color: #cbd5e0;
    transition: all 0.2s ease;
  }
`;

const FormWrapper = styled.div`
  max-width: 1000px;
  margin: 2rem auto auto auto;
  padding: 1.5rem;
  padding-bottom: 120px; /* Space for fixed action container */
  background-color: var(--app-background-color, #ffffec);
  font-family: 'product_sansregular', sans-serif;

  h2 {
    text-align: center;
    margin-bottom: 1.75rem;
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--primary-text);
    position: relative;
    padding-bottom: 0.5rem;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 50px;
      height: 3px;
      background: var(--primary-color, #948924);
      border-radius: 2px;
    }
  }

  .card {
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
    border-radius: 20px;
    padding: 1.25rem;
    margin-bottom: 2rem;
    background: var(--card-grey, rgba(255, 255, 255, 0.9));
    backdrop-filter: blur(10px);
    box-shadow: 0 10px 30px var(--shadow-color, rgba(0, 0, 0, 0.03));
    transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px var(--shadow-color, rgba(0, 0, 0, 0.05));
    }
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .flat-row {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
    
    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }

  .form-row {
    background-color: var(--card-grey, #fafafa);
    padding: 1.75rem;
    border-radius: 16px;
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
    border-left: 5px solid var(--primary-color, #948924);
    box-shadow: 0 4px 10px var(--shadow-color, rgba(0,0,0,0.01));
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &:hover {
      box-shadow: 0 6px 15px var(--shadow-color, rgba(0,0,0,0.03));
      background-color: var(--hover-bg, #ffffff);
    }
  }

  .total-result {
    background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
    padding: 1.5rem;
    border-radius: 16px;
    border: 1px solid rgba(46, 125, 50, 0.1);
    text-align: center;
    margin-top: 1.5rem;
    box-shadow: 0 4px 12px rgba(46, 125, 50, 0.08);
    
    h3 {
      color: #2e7d32;
      margin-bottom: 0.5rem;
      font-size: 1.3rem;
      font-weight: 700;
    }
    
    p {
      color: #388e3c;
      font-weight: 700;
      font-size: 0.95rem;
      margin: 0;
    }
  }

  label {
    display: block;
    margin-bottom: 0.8rem;
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--secondary-text, #555);
    text-transform: uppercase;
    letter-spacing: 0.75px;
  }

  input,
  select,
  textarea {
    font-family: 'product_sansregular', sans-serif;
    font-size: 1rem;
    vertical-align: middle;
    width: 100%;
    border-radius: 10px;
    border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
    padding: 0.75rem 1rem;
    background-color: var(--input-bg, #fafafa);
    color: var(--primary-text);
    transition: all 0.3s ease;
    box-sizing: border-box;

    &:focus {
      border-color: var(--primary-color, #948924);
      background-color: var(--input-bg, white);
      color: var(--primary-text);
      box-shadow: 0 0 0 3px rgba(148, 137, 36, 0.15);
      outline: none;
    }
  }

  .boton {
    padding: 12px 24px;
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: bold;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(1px);
    }
  }

  /* Specific button styles */
  .btn-primary {
    background: linear-gradient(135deg, #708dff 0%, #a370ff 100%);
    &:hover {
      filter: brightness(1.05);
    }
  }

  .btn-secondary {
    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
    &:hover {
      filter: brightness(1.05);
    }
  }

  .btn-success {
    background: linear-gradient(135deg, #2ec4b6 0%, #00b4d8 100%);
    &:hover {
      filter: brightness(1.05);
    }
  }

  .receipt-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    align-items: end;

    .receipt-col {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .date-row {
      display: flex;
      gap: 0.5rem;
      input {
        text-align: center;
        padding: 0.75rem 0.5rem;
      }
    }
  }

  @media (max-width: 480px) {
    padding: 0;
    padding-bottom: 180px; /* Space for stacked action buttons */
    margin-top: 0;

    .card {
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1rem;
      border: none;
      box-shadow: none;
    }

    .form-row {
      padding: 1rem;
      border-radius: 12px;
      gap: 0.75rem;
    }

    .receipt-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    h2 {
      font-size: 1.3rem;
      margin-bottom: 1.25rem;
    }
  }
`;

const FloatingButtonContainer = styled.div`
  position: fixed;
  bottom: 25px;
  right: 25px;
  z-index: 1000;
  display: flex;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(15px);
  padding: 0.75rem 1.25rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    gap: 0.5rem;
    align-items: flex-end;
    bottom: 15px;
    right: 15px;
    padding: 0.5rem;
    background: transparent;
    border: none;
    box-shadow: none;
    backdrop-filter: none;
  }
`;

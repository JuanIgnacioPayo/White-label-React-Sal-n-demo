import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function usePresupuestoCarrito(prices, serviciosOpcionales, serviciosUnicos) {
    const [carrito, setCarrito] = useState([]);

    // EFECTO PARA ACTUALIZAR PRECIOS EN EL CARRITO SI CAMBIAN LOS PRECIOS GLOBALES
    useEffect(() => {
        setCarrito(prevCarrito => {
            return (prevCarrito || []).map(item => {
                let newPrice = item.precio;

                // 1. Rental Services
                if (item.id === 1) newPrice = prices.alquiler3hs;
                else if (item.id === 3) newPrice = prices.alquiler4hs;
                else if (item.id === 13) newPrice = prices.alquiler4hs;
                else if (item.id === 14) newPrice = prices.alquiler4hs;

                // 2. Base Extras
                else if (item.id === 2) newPrice = prices.horaExtraPromo;
                else if (item.id === 4) newPrice = prices.horaExtraFinde;

                // 3. Waitress
                else if (item.id === 5) newPrice = prices.camarera;

                // 4. Checking Optional Services
                else {
                    const serviceInList = serviciosOpcionales.find(s => s.id === item.id);
                    if (serviceInList) {
                        newPrice = serviceInList.precio;
                    }
                }

                // Update if price is different and non-zero
                if (newPrice && newPrice !== 0 && newPrice !== item.precio) {
                    return { ...item, precio: newPrice };
                }
                return item;
            });
        });
    }, [prices, serviciosOpcionales]);

    const agregarCamarera = (servicioBase) => {
        setCarrito(prevCarrito => {
            const newCamarera = {
                ...servicioBase,
                id: 5, // Asegurarse que el ID es 5
                nombre: "Contratación de camarera",
                precio: prices.camarera, // Precio por hora
                cantidad: 3,
                uuid: `camarera-${Date.now()}-${Math.random()}`
            };
            toast.success(`Se agregó una camarera al carrito (contratación mínima de 3hs).`);
            return [...prevCarrito, newCamarera];
        });
    };

    const modificarHorasCamarera = (uuid, cambio) => { // cambio puede ser 1 o -1
        setCarrito(prevCarrito => {
            const itemAModificar = prevCarrito.find(item => item.uuid === uuid);
            if (!itemAModificar) return prevCarrito;

            const nuevaCantidad = itemAModificar.cantidad + cambio;

            if (nuevaCantidad < 3) {
                toast.error(`Se eliminó una camarera del carrito.`);
                return prevCarrito.filter(item => item.uuid !== uuid);
            } else {
                const toastMessage = cambio > 0 ? 'Se agregó 1 hora a la camarera.' : 'Se quitó 1 hora a la camarera.';
                toast.success(toastMessage);
                return prevCarrito.map(item =>
                    item.uuid === uuid ? { ...item, cantidad: nuevaCantidad, nombre: 'Contratación de camarera' } : item
                );
            }
        });
    };

    const agregarAlCarrito = (servicio) => {
        if (servicio.id === 5) {
            agregarCamarera(servicio);
            return;
        }

        setCarrito(prev => {
            let newCarrito = [...prev];
            const existente = newCarrito.find(item => item.id === servicio.id);

            if (existente) {
                if (serviciosUnicos.includes(servicio.id)) {
                    toast.info(`${servicio.nombre} ya está en el carrito. Solo puedes agregar una unidad.`);
                    return newCarrito;
                }
                toast.success(`${servicio.nombre} agregado al carrito.`);
                newCarrito = newCarrito.map(item => item.id === servicio.id ? { ...item, cantidad: item.cantidad + 1 } : item);
            } else {
                toast.success(`${servicio.nombre} agregado al carrito.`);
                newCarrito = [...newCarrito, { ...servicio, cantidad: 1 }];
            }

            // Logic for "Parrillero" and "Usan la parrilla"
            if (servicio.id === 12) { // If Parrillero is added
                const usanParrillaService = serviciosOpcionales.find(s => s.id === 15 || s.id === 16) || {
                    id: 15,
                    nombre: "Usan la parrilla",
                    precio: prices.usanParrilla || 0
                };
                const usanParrillaInCart = newCarrito.find(item => item.id === 15 || item.id === 16);
                if (usanParrillaService && !usanParrillaInCart) {
                    newCarrito = [...newCarrito, { ...usanParrillaService, cantidad: 1 }];
                    toast.success(`${usanParrillaService.nombre} agregado automáticamente.`);
                }
            }
            return newCarrito;
        });
    };

    const eliminarDelCarrito = (id) => {
        // This function will NOT handle waitresses (id 5), as they are managed by modificarHorasCamarera.
        if (id === 5) return;

        setCarrito(prev => {
            let newCarrito = [...prev];
            const existente = newCarrito.find(item => item.id === id);

            if (existente) {
                if (existente.cantidad > 1) {
                    newCarrito = newCarrito.map(item =>
                        item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item
                    );
                } else {
                    newCarrito = newCarrito.filter(item => item.id !== id);
                }

                // Logic for "Parrillero" and "Usan la parrilla"
                if (id === 12) { // If Parrillero is removed
                    newCarrito = newCarrito.filter(item => item.id !== 15 && item.id !== 16); // Remove "Usan la parrilla"
                }
            }
            return newCarrito;
        });
    };

    return {
        carrito,
        setCarrito,
        agregarAlCarrito,
        eliminarDelCarrito,
        modificarHorasCamarera,
        agregarCamarera
    };
}

import { useLoading } from '../contexts/LoadingContext';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { app } from '../firebase/firebase';
import { getDatabase, ref, get } from 'firebase/database';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
  padding: 20px;
  background-color: var(--background-color-light);
  color: var(--text-color);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 20px;
`;

const Message = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 30px;
`;

const LinkStyled = styled.a`
  color: var(--accent-color);
  text-decoration: underline;
  &:hover {
    color: var(--accent-color-dark);
  }
`;

const CotizacionExitosa = () => {
    const { completeTask } = useLoading();
    React.useEffect(() => { completeTask('app_init'); }, [completeTask]);

    const location = useLocation();
    const [whatsappNumber, setWhatsappNumber] = useState('');

    useEffect(() => {
        const fetchWhatsappNumber = async () => {
            const db = getDatabase(app);
            const dbRef = ref(db, 'datosId/25');

            try {
                const snapshot = await get(dbRef);
                if (snapshot.exists()) {
                    let fetchedNumber = snapshot.val().numero_whatsapp || '';
                    fetchedNumber = fetchedNumber.replace(/\D/g, ''); 

                    let formattedNumber = '';
                    if (fetchedNumber.startsWith('549')) {
                        formattedNumber = '+' + fetchedNumber;
                    } else if (fetchedNumber.startsWith('011')) {
                        formattedNumber = '+549' + fetchedNumber.substring(1);
                    } else if (fetchedNumber.startsWith('11')) {
                        formattedNumber = '+549' + fetchedNumber;
                    } else {
                        formattedNumber = '+549' + fetchedNumber;
                    }

                    setWhatsappNumber(formattedNumber);
                } else {
                    setWhatsappNumber('+5491100000000');
                }
            } catch (error) {
                console.error("Error al obtener el número de WhatsApp de Firebase:", error);
                setWhatsappNumber('+5491100000000');
            }
        };

        fetchWhatsappNumber();
    }, []);

    const queryParams = new URLSearchParams(location.search);
    const whatsappMessage = queryParams.get('message') || "Hola! Quisiera hacer una consulta sobre una fecha para un evento.";
    const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}` : '';

    // Redirección directa a WhatsApp
    useEffect(() => {
        if (whatsappUrl) {
            window.location.href = whatsappUrl;
        }
    }, [whatsappUrl]);

    return (
        <Container>
            <Title>Redirigiendo a WhatsApp</Title>
            <Message>Si no te redirige automáticamente en unos segundos, por favor hacé click en el siguiente enlace:</Message>
            {whatsappUrl ? (
                <LinkStyled
                    href={whatsappUrl}
                    target="_self"
                    rel="noopener noreferrer"
                >
                    Ir a WhatsApp
                </LinkStyled>
            ) : (
                <Message>Cargando enlace de WhatsApp...</Message>
            )}
        </Container>
    );
};

export default CotizacionExitosa;
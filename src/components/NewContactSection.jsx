import React, { useState } from 'react';
import styled from 'styled-components';
import emailjs from '@emailjs/browser'; // Import emailjs

const FormContainer = styled.div`
  color: #333;
  width: 100%; 
  margin: 2rem auto; /* Center the component and add vertical margin */
  padding: 25px; /* Match HorariosVisita padding */
  background-color: var(--card-grey); /* Match background color */
  border: 1px solid #eaeaea; /* Match border */
  border-radius: 10px; /* Match rounded corners */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); /* Match shadow */
  h2 {
    text-align: center;
    margin-bottom: 1.5rem;
    color: var(--primary-color);
    font-size: 1.5rem; /* Adjusted font size for heading */
  }

  @media (max-width: 768px) {
    width: 65%; /* Set width to 65% for mobile devices */
  }
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem; /* Adjusted font size */
  font-family: 'product_sansregular', sans-serif;
  background-color: #fefdfa;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const Textarea = styled.textarea`
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem; /* Adjusted font size */
  font-family: 'product_sansregular', sans-serif;
  background-color: #fefdfa;
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const SubmitButton = styled.button`
  font-family: "product_sansregular", sans-serif;
  padding: 0.9rem;
  border: none;
  border-radius: 4px;
  background-color: var(--primary-color-dark);
  color: var(--primary-color);
  font-size: 1rem; /* Adjusted font size */
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 2px solid var(--primary-color);
  &:hover {
    
    color: var(--white-text);
    
    background-color: var(--primary-color);
  }
`;

const SuccessMessage = styled.p`
  text-align: center;
  color: green;
  font-weight: bold;
`;

const ErrorMessage = styled.p`
  text-align: center;
  color: red;
`;

const NewContactSection = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Initialize EmailJS with your Public Key
  // This should ideally be done once, e.g., in your main App component or a useEffect
  // For simplicity, we'll do it here, but be aware of potential re-initialization if component re-renders frequently.
  emailjs.init("YphsoytPUOtCkOlwe"); // Replace with your actual Public Key

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setError('Por favor, completá todos los campos.');
      return;
    }
    setError('');

    const serviceId = 'service_pl4osgm'; // Replace with your actual Service ID
    const templateId = 'template_gnbjjpa'; // Replace with your actual Template ID
    const templateParams = {
      name: name,
      email: email,
      message: message
    };

    try {
      await emailjs.send(serviceId, templateId, templateParams);
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setError('Hubo un error al enviar tu mensaje. Por favor, intentá de nuevo.');
      console.error('EmailJS error:', err);
    }
  };

  if (submitted) {
    return <SuccessMessage>¡Gracias por tu mensaje! Te contactaremos pronto.</SuccessMessage>;
  }

  return (
    <FormContainer>
      <h2>¿Tenés alguna consulta o querés más información?</h2>
      <StyledForm onSubmit={handleSubmit}>
        <Input
          type="text"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Tu email o whatsapp"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Textarea
          placeholder="Escribí tu mensaje aquí..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <SubmitButton type="submit">Enviar Consulta</SubmitButton>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </StyledForm>
    </FormContainer>
  );
};

export default NewContactSection;

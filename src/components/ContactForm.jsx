import React, { useState } from 'react';
import styled from 'styled-components';
import emailjs from '@emailjs/browser'; // Import emailjs

const FormContainer = styled.div`
  color: #1811b;
  padding: 1rem;
  h2 {
    text-align: center;
    margin-bottom: 2rem;
    color: #18181b;
    font-weight: 800;
    font-size: 1.8rem;
  }
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #71717a;
  text-align: center;
  letter-spacing: 0.05em;
`;

const Input = styled.input`
  padding: 1rem;
  background-color: #fafafa;
  border: none;
  border-radius: 1.25rem;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s;
  text-align: center;

  &:focus {
    outline: none;
    background-color: #f4f4f5;
    box-shadow: 0 0 0 2px #8b5cf6;
  }

  &::placeholder {
    color: #a1a1aa;
    text-align: center;
  }
`;

const Textarea = styled.textarea`
  padding: 1rem;
  background-color: #fafafa;
  border: none;
  border-radius: 1.25rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: all 0.2s;
  text-align: center;

  &:focus {
    outline: none;
    background-color: #f4f4f5;
    box-shadow: 0 0 0 2px #8b5cf6;
  }

  &::placeholder {
    color: #a1a1aa;
    text-align: center;
  }
`;

const SubmitButton = styled.button`
  padding: 1rem;
  border: none;
  border-radius: 9999px;
  background-color: #8b5cf6;
  color: white;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 0.5rem;
  
  &:hover {
    transform: scale(1.05);
    background-color: #7c3aed;
    box-shadow: 0 10px 15px -3px rgba(139, 92, 246, 0.3);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const PortfolioSection = styled.div`
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f4f4f5;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  p {
    font-size: 0.9rem;
    color: #71717a;
  }

  a {
    color: #8b5cf6;
    text-decoration: none;
    font-weight: 700;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: color 0.2s;

    &:hover {
      color: #7c3aed;
      text-decoration: underline;
    }
  }
`;

const SuccessMessage = styled.div`
  text-align: center;
  color: #10b981;
  font-weight: bold;
  padding: 2rem;
  background-color: #ecfdf5;
  border-radius: 1.5rem;
`;

const ErrorMessage = styled.p`
  text-align: center;
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

const ContactForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Initialize EmailJS with your Public Key
  emailjs.init("YphsoytPUOtCkOlwe"); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setError('Por favor, completá todos los campos.');
      return;
    }
    setError('');

    const serviceId = 'service_1h7mlx8'; 
    const templateId = 'template_yhkx34c'; 
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
    return (
      <FormContainer>
        <SuccessMessage>
          <h3>¡Mensaje enviado!</h3>
          <p>Te contactaré a la brevedad.</p>
        </SuccessMessage>
        <PortfolioSection>
          <p>Mientras tanto, podés seguir viendo mis trabajos:</p>
          <a href="https://portfolio-juan-payo.web.app/" target="_blank" rel="noopener noreferrer">
            Visitar mi Portfolio 🚀
          </a>
        </PortfolioSection>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <h2>Contacto</h2>
      <StyledForm onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Tu Nombre</Label>
          <Input
            type="text"
            placeholder="¿Cómo te llamás?"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Email o WhatsApp</Label>
          <Input
            type="text"
            placeholder="¿Dónde te contacto?"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormGroup>

        <FormGroup>
          <Label>Mensaje</Label>
          <Textarea
            placeholder="¿En qué puedo ayudarte?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </FormGroup>

        <SubmitButton type="submit">Enviar Consulta</SubmitButton>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </StyledForm>

      <PortfolioSection>
        <p>¿Querés ver más de lo que hago?</p>
        <a href="https://portfolio-juan-payo.web.app/" target="_blank" rel="noopener noreferrer">
          Conocé mi Portfolio
        </a>
      </PortfolioSection>
    </FormContainer>
  );
};

export default ContactForm;


import styled from "styled-components";
import { useState, useEffect } from 'react';
import { app, functions } from "../../firebase/firebase";
import { getDatabase, ref, set, get } from "firebase/database";
import { httpsCallable } from "firebase/functions";
import { toast } from 'react-toastify';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: var(--cardGrey, #fffbf5);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 0rem;
  width: 100%;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
  gap: 1.5rem;
  padding-bottom: 50px;
`;

const Title = styled.h2`
  color: var(--primaryText, #111241);
  margin-top: 0;
  border-bottom: 2px solid var(--primaryColor, #b0aa6d);
  padding-bottom: 8px;
`;

const Description = styled.p`
  color: #555;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
`;

const AlertBox = styled.div`
  background-color: #e8f4fd;
  border-left: 4px solid #0288d1;
  color: #01579b;
  padding: 12px 16px;
  border-radius: 4px;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  flex-wrap: wrap;
  gap: 10px;
  
  h3 {
    margin: 0;
  }
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
`;

const StatusCard = styled.div`
  background: white;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e0dfdb;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
`;

const CardHeader = styled.div`
  font-weight: bold;
  color: var(--primaryText, #111241);
  font-size: 0.95rem;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${props => props.$active ? '#2e7d32' : '#757575'};
`;

const StatusDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.$active ? '#4caf50' : '#bdbdbd'};
  display: inline-block;
`;

const Dropzone = styled.div`
  border: 2px dashed ${props => props.$dragActive ? 'var(--primaryColor, #b0aa6d)' : '#ccc'};
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  background: ${props => props.$dragActive ? 'rgba(176, 170, 109, 0.05)' : '#fafafa'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: var(--primaryColor, #b0aa6d);
    background: rgba(176, 170, 109, 0.02);
  }
`;

const DropzoneText = styled.p`
  margin: 10px 0 0 0;
  font-size: 1rem;
  color: #666;
  font-weight: 500;
`;

const FileInput = styled.input`
  display: none;
`;

const PreviewContainer = styled.div`
  background: #f1ebd9;
  border: 1px solid #dcd3b5;
  border-radius: 6px;
  padding: 15px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const KeyItem = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  padding-bottom: 5px;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const Button = styled.button`
  padding: 10px 18px;
  background-color: ${props => props.$secondary ? '#757575' : 'var(--primaryColor, #b0aa6d)'};
  color: var(--whiteText, #ffffff);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: ${props => props.$secondary ? '#424242' : 'var(--primaryText, #111241)'};
  }
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ResultsBox = styled.div`
  background: #fdfdfd;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ResultItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 0.95rem;
  color: var(--primaryText, #111241);
`;

const ResultStatus = styled.span`
  color: ${props => props.$ok ? '#2e7d32' : '#c62828'};
  font-size: 0.9rem;
`;

const ResultMessage = styled.span`
  font-size: 0.85rem;
  color: #666;
`;

const parseEnv = (envText) => {
  const env = {};
  if (!envText) return env;
  envText.split('\n').forEach(line => {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith('#')) return;
    const parts = cleanLine.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
  return env;
};

const GestorCredenciales = () => {
  const [dbStatus, setDbStatus] = useState({
    groq: false,
    gemini: false,
    afipToken: false,
    afipTokenJuan: false,
    certMaria: false,
    privadaMaria: false,
    certJuan: false,
    privadaJuan: false,
    credentials: false,
    serviceAccount: false
  });
  
  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [fileType, setFileType] = useState("secrets"); // "secrets", "service_account", "oauth"
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const fetchStatus = async () => {
    try {
      const db = getDatabase(app);
      
      const groqSnap = await get(ref(db, 'config/apiKeys/groq'));
      const geminiSnap = await get(ref(db, 'config/apiKeys/google_gemini'));
      const afipSnap = await get(ref(db, 'config/afip'));
      const googleSnap = await get(ref(db, 'config/google/credentials'));
      const saSnap = await get(ref(db, 'config/google/serviceAccountKey'));

      const afipData = afipSnap.exists() ? afipSnap.val() : {};
      const afipKeys = afipData.keys || {};

      const isGroqValid = groqSnap.exists() && 
                          groqSnap.val().trim() !== '';

      setDbStatus({
        groq: isGroqValid,
        gemini: geminiSnap.exists() && geminiSnap.val().trim() !== '',
        afipToken: !!afipData.accessToken,
        afipTokenJuan: !!afipData.accessTokenJuan,
        certMaria: !!(afipKeys.certificado_crt || afipKeys.certificado),
        privadaMaria: !!(afipKeys.privada_key || afipKeys.privada),
        certJuan: !!(afipKeys.certificado_20325938081_crt || afipKeys.certificado_20325938081),
        privadaJuan: !!(afipKeys.privada_20325938081_key || afipKeys.privada_20325938081),
        credentials: googleSnap.exists(),
        serviceAccount: saSnap.exists()
      });
    } catch (e) {
      console.error("Error reading database credential status:", e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        
        // 1. Detectar si es Cuenta de Servicio de Google (Service Account)
        if (json.client_email && json.private_key) {
          setFileType("service_account");
          setParsedData(json);
          toast.success("Cuenta de Servicio de Google (Service Account) detectada.");
          return;
        }

        // 2. Detectar si es OAuth Credentials de Google
        if (json.installed || json.web) {
          setFileType("oauth");
          setParsedData(json);
          toast.success("Credenciales OAuth de Google detectadas.");
          return;
        }

        // 3. Detectar si es el archivo de secretos unificado
        if (json.root_env || json.functions_env_backup || json.afip_keys) {
          setFileType("secrets");
          setParsedData(json);
          toast.success("Archivo de secretos unificado detectado.");
          return;
        }

        toast.error("El formato de este archivo JSON no es reconocido. Sube un archivo de secretos unificado, cuenta de servicio o credenciales OAuth.");
      } catch (err) {
        toast.error("Error al parsear el archivo JSON. Asegúrate de subir un archivo .json válido.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!parsedData) return;
    setLoading(true);
    
    try {
      const db = getDatabase(app);
      
      if (fileType === "service_account") {
        await set(ref(db, 'config/google/serviceAccountKey'), parsedData);
        toast.success("🔑 ¡Cuenta de Servicio de Google (Service Account) guardada con éxito en la Base de Datos!");
      } else if (fileType === "oauth") {
        await set(ref(db, 'config/google/credentials'), parsedData);
        toast.success("🔑 ¡Credenciales OAuth de Google guardadas con éxito en la Base de Datos!");
      } else {
        // "secrets"
        const updates = {};
        const rootEnv = parseEnv(parsedData.root_env);
        const funcEnv = parseEnv(parsedData.functions_env_backup);
        const afipKeys = parsedData.afip_keys || {};

        const groqKey = funcEnv.GROQ_API_KEY || rootEnv.VITE_GROQ_API_KEY;
        if (groqKey && groqKey.trim() !== '') {
          updates['config/apiKeys/groq'] = groqKey;
        }

        if (funcEnv.AFIP_ACCESS_TOKEN) {
          updates['config/afip/accessToken'] = funcEnv.AFIP_ACCESS_TOKEN;
        }
        if (funcEnv.AFIP_ACCESS_TOKEN_JUAN) {
          updates['config/afip/accessTokenJuan'] = funcEnv.AFIP_ACCESS_TOKEN_JUAN;
        }

        if (afipKeys['certificado.crt']) {
          updates['config/afip/keys/certificado_crt'] = afipKeys['certificado.crt'];
        }
        if (afipKeys['privada.key']) {
          updates['config/afip/keys/privada_key'] = afipKeys['privada.key'];
        }
        if (afipKeys['certificado_20325938081.crt']) {
          updates['config/afip/keys/certificado_20325938081_crt'] = afipKeys['certificado_20325938081.crt'];
        }
        if (afipKeys['privada_20325938081.key']) {
          updates['config/afip/keys/privada_20325938081_key'] = afipKeys['privada_20325938081.key'];
        }
        if (afipKeys['pedido.csr']) {
          updates['config/afip/keys/pedido_csr'] = afipKeys['pedido.csr'];
        }
        if (afipKeys['pedido_20325938081.csr']) {
          updates['config/afip/keys/pedido_20325938081_csr'] = afipKeys['pedido_20325938081.csr'];
        }

        if (parsedData.credentials_json) {
          updates['config/google/credentials'] = parsedData.credentials_json;
        }

        if (parsedData.service_account_json) {
          updates['config/google/serviceAccountKey'] = parsedData.service_account_json;
        }

        for (const [path, value] of Object.entries(updates)) {
          await set(ref(db, path), value);
        }

        toast.success("🔑 ¡Credenciales del archivo unificado guardadas con éxito en Firebase!");
      }
      
      setParsedData(null);
      await fetchStatus();
    } catch (err) {
      toast.error("Error al subir credenciales a Firebase.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnections = async () => {
    setTesting(true);
    setTestResults(null);
    toast.info("Iniciando pruebas de conectividad de producción...");
    
    try {
      const testCreds = httpsCallable(functions, 'testCredentialsStatus');
      const response = await testCreds();
      setTestResults(response.data);
      toast.success("Pruebas finalizadas con éxito.");
    } catch (err) {
      toast.error("Error al ejecutar las pruebas de conexión.");
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Container>
      <Title>Gestor de Credenciales Unificado</Title>
      
      <Description>
        Esta interfaz te permite subir el archivo unificado de secretos (<code>salon-secrets.json</code>), o tus archivos JSON de Google (Cuenta de Servicio / OAuth) para guardarlos de forma segura en Firebase Realtime Database.
      </Description>

      <AlertBox>
        📌 <strong>Nota Importante</strong>: El cuadro de "Estado en la Nube" a continuación muestra exclusivamente las credenciales guardadas **en la base de datos**. Si actualmente las ves marcadas como "No cargadas", tus servidores de producción **siguen funcionando con normalidad** usando la configuración local por defecto que ya tienen desplegada de forma estática en la nube. Al subir el archivo, pasarán a usarse dinámicamente.
      </AlertBox>

      <SectionHeader>
        <h3>Estado de Configuración en la Nube (Base de Datos)</h3>
        <Button onClick={handleTestConnections} disabled={testing} $secondary>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            {testing ? 'sync' : 'network_check'}
          </span>
          {testing ? "Realizando pruebas..." : "Probar Conexiones de Producción"}
        </Button>
      </SectionHeader>

      {testResults && (
        <ResultsBox>
          <strong style={{color: 'var(--primaryText)'}}>Resultados de Conectividad en Tiempo Real:</strong>
          
          <ResultItem>
            <ResultHeader>
              <span>Chatbot (Groq AI)</span>
              <ResultStatus $ok={testResults.groq?.ok}>
                {testResults.groq?.ok ? "✔ Conectado" : "❌ Error"}
              </ResultStatus>
            </ResultHeader>
            <ResultMessage>{testResults.groq?.message}</ResultMessage>
          </ResultItem>

          <ResultItem>
            <ResultHeader>
              <span>Google Calendar Integration</span>
              <ResultStatus $ok={testResults.calendar?.ok}>
                {testResults.calendar?.ok ? "✔ Conectado" : "❌ Error"}
              </ResultStatus>
            </ResultHeader>
            <ResultMessage>{testResults.calendar?.message}</ResultMessage>
          </ResultItem>

          <ResultItem>
            <ResultHeader>
              <span>Facturación AFIP (María)</span>
              <ResultStatus $ok={testResults.afipMaria?.ok}>
                {testResults.afipMaria?.ok ? "✔ Conectado" : "❌ Error"}
              </ResultStatus>
            </ResultHeader>
            <ResultMessage>{testResults.afipMaria?.message}</ResultMessage>
          </ResultItem>

          <ResultItem>
            <ResultHeader>
              <span>Facturación AFIP (Juan)</span>
              <ResultStatus $ok={testResults.afipJuan?.ok}>
                {testResults.afipJuan?.ok ? "✔ Conectado" : "❌ Error"}
              </ResultStatus>
            </ResultHeader>
            <ResultMessage>{testResults.afipJuan?.message}</ResultMessage>
          </ResultItem>
        </ResultsBox>
      )}

      <StatusGrid>
        <StatusCard>
          <CardHeader>Asistente AI (Chatbot)</CardHeader>
          <StatusIndicator $active={dbStatus.groq}>
            <StatusDot $active={dbStatus.groq} />
            {dbStatus.groq ? "Cargado en DB" : "No cargado en DB (Usando fallback local)"}
          </StatusIndicator>
        </StatusCard>

        <StatusCard>
          <CardHeader>Facturación AFIP (María)</CardHeader>
          <StatusIndicator $active={dbStatus.certMaria && dbStatus.privadaMaria && dbStatus.afipToken}>
            <StatusDot $active={dbStatus.certMaria && dbStatus.privadaMaria && dbStatus.afipToken} />
            {dbStatus.certMaria && dbStatus.privadaMaria && dbStatus.afipToken ? "Cargado en DB" : "No cargado en DB (Usando fallback local)"}
          </StatusIndicator>
          <span style={{fontSize: '0.75rem', color: '#666'}}>
            Certificado: {dbStatus.certMaria ? "✔" : "❌"} | Clave Privada: {dbStatus.privadaMaria ? "✔" : "❌"} | Token: {dbStatus.afipToken ? "✔" : "❌"}
          </span>
        </StatusCard>

        <StatusCard>
          <CardHeader>Facturación AFIP (Juan)</CardHeader>
          <StatusIndicator $active={dbStatus.certJuan && dbStatus.privadaJuan && dbStatus.afipTokenJuan}>
            <StatusDot $active={dbStatus.certJuan && dbStatus.privadaJuan && dbStatus.afipTokenJuan} />
            {dbStatus.certJuan && dbStatus.privadaJuan && dbStatus.afipTokenJuan ? "Cargado en DB" : "No cargado en DB (Usando fallback local)"}
          </StatusIndicator>
          <span style={{fontSize: '0.75rem', color: '#666'}}>
            Certificado: {dbStatus.certJuan ? "✔" : "❌"} | Clave Privada: {dbStatus.privadaJuan ? "✔" : "❌"} | Token: {dbStatus.afipTokenJuan ? "✔" : "❌"}
          </span>
        </StatusCard>

        <StatusCard>
          <CardHeader>Google OAuth (Login / Web)</CardHeader>
          <StatusIndicator $active={dbStatus.credentials}>
            <StatusDot $active={dbStatus.credentials} />
            {dbStatus.credentials ? "Cargado en DB" : "No cargado en DB (Usando fallback local)"}
          </StatusIndicator>
        </StatusCard>

        <StatusCard>
          <CardHeader>Google Service Account (Calendar)</CardHeader>
          <StatusIndicator $active={true}>
            <StatusDot $active={true} />
            {dbStatus.serviceAccount ? "Cargado en DB" : "Identidad Interna de Google (Activo)"}
          </StatusIndicator>
        </StatusCard>
      </StatusGrid>

      <h3 style={{marginTop: '1.5rem'}}>Cargar Archivo de Claves</h3>
      
      {!parsedData ? (
        <Dropzone 
          $dragActive={dragActive} 
          onDragEnter={handleDrag} 
          onDragOver={handleDrag} 
          onDragLeave={handleDrag} 
          onDrop={handleDrop}
          onClick={() => document.getElementById('secrets-file-input').click()}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: dragActive ? 'var(--primaryColor)' : '#aaa' }}>
            upload_file
          </span>
          <DropzoneText>Arrastra aquí tu <strong>secrets.json</strong> o <strong>service-account.json</strong> o haz clic para buscarlo</DropzoneText>
          <FileInput 
            id="secrets-file-input" 
            type="file" 
            accept=".json" 
            onChange={handleFileChange} 
          />
        </Dropzone>
      ) : (
        <PreviewContainer>
          <strong style={{color: 'var(--primaryText)'}}>Contenido listo para subir:</strong>
          
          {fileType === "service_account" && (
            <>
              <KeyItem>
                <span>Tipo de archivo:</span>
                <strong style={{color: '#2e7d32'}}>Cuenta de Servicio de Google (Service Account)</strong>
              </KeyItem>
              <KeyItem>
                <span>Proyecto de Google Cloud:</span>
                <strong>{parsedData.project_id}</strong>
              </KeyItem>
              <KeyItem>
                <span>Email de la Cuenta de Servicio:</span>
                <strong>{parsedData.client_email}</strong>
              </KeyItem>
            </>
          )}

          {fileType === "oauth" && (
            <>
              <KeyItem>
                <span>Tipo de archivo:</span>
                <strong style={{color: '#2e7d32'}}>Credenciales Google OAuth (Client ID)</strong>
              </KeyItem>
              <KeyItem>
                <span>Client ID:</span>
                <strong style={{wordBreak: 'break-all'}}>{(parsedData.installed || parsedData.web)?.client_id}</strong>
              </KeyItem>
            </>
          )}

          {fileType === "secrets" && (
            <>
              <KeyItem>
                <span>Variables del Frontend (.env):</span>
                <strong style={{color: '#2e7d32'}}>Detectadas</strong>
              </KeyItem>
              <KeyItem>
                <span>Token y credenciales de AFIP:</span>
                <strong style={{color: '#2e7d32'}}>Detectadas</strong>
              </KeyItem>
              <KeyItem>
                <span>Certificados y llaves privadas (keys/):</span>
                <strong style={{color: '#2e7d32'}}>
                  {Object.keys(parsedData.afip_keys || {}).length} archivos cargados
                </strong>
              </KeyItem>
              <KeyItem>
                <span>Credenciales Google (OAuth):</span>
                <strong style={{color: parsedData.credentials_json ? '#2e7d32' : '#c62828'}}>
                  {parsedData.credentials_json ? "Detectadas" : "No detectadas"}
                </strong>
              </KeyItem>
            </>
          )}

          <div style={{display: 'flex', gap: '10px', marginTop: '10px', alignSelf: 'flex-end'}}>
            <Button style={{background: '#666'}} onClick={() => setParsedData(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={loading}>
              {loading ? "Subiendo..." : "Confirmar y Subir a Firebase"}
            </Button>
          </div>
        </PreviewContainer>
      )}
    </Container>
  );
};

export default GestorCredenciales;

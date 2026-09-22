import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { FaCloudUploadAlt, FaFile, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const DropzoneContainer = styled.div`
  border: 2px dashed ${props => props.$isDragActive ? '#4caf50' : '#ccc'};
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  background-color: ${props => props.$isDragActive ? 'rgba(76, 175, 80, 0.1)' : '#f9f9f9'};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  &:hover {
    border-color: #4caf50;
    background-color: #f0fdf4;
  }
`;

const IconWrapper = styled.div`
  font-size: 3rem;
  color: ${props => props.$isDragActive ? '#4caf50' : '#888'};
  margin-bottom: 15px;
  transition: color 0.3s ease;
`;

const Text = styled.p`
  margin: 0;
  color: #555;
  font-size: 1rem;
  font-weight: 500;
`;

const SubText = styled.p`
  margin: 5px 0 0;
  color: #999;
  font-size: 0.85rem;
`;

const FilePreview = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 10px 15px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  margin-top: 15px;
  font-size: 0.9rem;
  color: #333;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: #eee;
  border-radius: 3px;
  margin-top: 15px;
  overflow: hidden;

  div {
    height: 100%;
    background-color: #4caf50;
    width: ${props => props.$progress}%;
    transition: width 0.3s ease;
  }
`;

const ErrorMsg = styled.div`
  color: #d32f2f;
  font-size: 0.85rem;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const GoogleDriveDropzone = ({ folderId, accessToken, employeeName }) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [lastUploadedFile, setLastUploadedFile] = useState(null);
    const [error, setError] = useState(null);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        setError(null);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            uploadFile(files[0]);
        }
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setError(null);
            uploadFile(files[0]);
        }
    };

    const uploadFile = async (file) => {
        if (!accessToken) {
            setError("No hay sesión de Google activa. Por favor inicie sesión.");
            return;
        }

        if (!folderId) {
            setError(`El empleado ${employeeName} no tiene carpeta de Drive configurada.`);
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        const metadata = {
            name: file.name,
            parents: [folderId]
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', file);

        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
            xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 100);
                    setUploadProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    setLastUploadedFile(file.name);
                    toast.success(`Archivo "${file.name}" subido correctamente a la carpeta de ${employeeName}.`);
                } else {
                    try {
                        const err = JSON.parse(xhr.responseText);
                        console.error("Drive Upload Error:", err);
                        setError(`Error al subir: ${err.error?.message || xhr.statusText}`);
                    } catch {
                        setError(`Error al subir: ${xhr.statusText}`);
                    }
                }
                setUploading(false);
            };

            xhr.onerror = () => {
                setError("Error de red al intentar subir el archivo.");
                setUploading(false);
            };

            xhr.send(form);

        } catch (err) {
            console.error(err);
            setError("Error inesperado al subir archivo.");
            setUploading(false);
        }
    };

    return (
        <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#555' }}>Subir archivos a Drive</h3>

            <input
                type="file"
                id="fileInput"
                style={{ display: 'none' }}
                onChange={handleFileInput}
                disabled={uploading}
            />

            <DropzoneContainer
                $isDragActive={isDragActive}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !uploading && document.getElementById('fileInput').click()}
            >
                {!uploading ? (
                    <>
                        <IconWrapper $isDragActive={isDragActive}>
                            <FaCloudUploadAlt />
                        </IconWrapper>
                        <Text>
                            {isDragActive ? "¡Suéltalo aquí!" : "Arrastra archivos aquí o haz clic"}
                        </Text>
                        <SubText>
                            Subir a carpeta de {employeeName || "empleado"}
                        </SubText>
                    </>
                ) : (
                    <>
                        <div style={{ width: '80%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span style={{ fontSize: '0.9rem' }}>Subiendo...</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{uploadProgress}%</span>
                            </div>
                            <ProgressBar $progress={uploadProgress}>
                                <div />
                            </ProgressBar>
                        </div>
                    </>
                )}

                {lastUploadedFile && !uploading && (
                    <FilePreview onClick={(e) => e.stopPropagation()}>
                        <FaCheckCircle color="#4caf50" />
                        <span>Subido: {lastUploadedFile}</span>
                    </FilePreview>
                )}

                {error && (
                    <ErrorMsg onClick={(e) => e.stopPropagation()}>
                        <FaExclamationCircle />
                        <span>{error}</span>
                    </ErrorMsg>
                )}

            </DropzoneContainer>
            {folderId && (
                <div style={{ marginTop: '5px', fontSize: '0.75rem', color: '#aaa', textAlign: 'right' }}>
                    ID Carpeta: ...{folderId.slice(-6)}
                </div>
            )}
        </div>
    );
};

export default GoogleDriveDropzone;

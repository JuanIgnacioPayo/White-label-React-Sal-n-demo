import React, { useState, useRef } from 'react';
import AdminPage from '../../pages/AdminPage';
export default function FormRecibo({ onTabChange }) {

  return (
      <AdminPage initialTab={1} onTabChange={onTabChange}></AdminPage>
  );
}
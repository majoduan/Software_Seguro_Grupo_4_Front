import React, { useEffect, useState } from "react";
import {
  Button,
  MenuItem,
  Select,
  Typography,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import iconoExcel from "../assets/icono-excel.png";
import { reporteAPI } from '../api/reporteAPI';
import "../styles/ReportePOA.css"; 

const tiposProyecto = [
  { value: "Investigacion", label: "Proyecto de Investigación" },
  { value: "Vinculacion", label: "Proyecto de Vinculación" },
  { value: "Transferencia", label: "Proyecto de Transferencia" },
];

const ReportePOA: React.FC = () => {
  const [anio, setAnio] = useState("");
  const [tipoProyecto, setTipoProyecto] = useState("");
  const [reporteJson, setReporteJson] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (reporteJson) setReporteJson(null);
  }, [anio, tipoProyecto]);


  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleGenerarReporte = async () => {
    if (!anio || !tipoProyecto) {
      setSnackbar({ open: true, message: "Selecciona año y tipo de proyecto.", severity: "error" });
      return;
    }
    setLoading(true);
    try {
      // Usar la API centralizada
      const data = await reporteAPI.generarReportePOA(anio, tipoProyecto);
      setReporteJson(data);
      setSnackbar({ open: true, message: "Reporte generado correctamente.", severity: "success" });
    } catch (error: any) {
      setReporteJson(null);
      const errorMessage = error?.response?.data?.detail || "Error al generar el reporte.";
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDescargar = async () => {
    if (!reporteJson) return;
    
    try {
      const blob = await reporteAPI.descargarReporteExcel(reporteJson);
      
      // Crear y descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reporte-poa.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setSnackbar({ open: true, message: "No se pudo descargar el archivo.", severity: "error" });
    }
  };

  return (
    <div className="reporte-poa-wrapper">
      <Typography variant="h3" className="titulo-reporte-poa-new" gutterBottom>
          Generar Reporte POA
        </Typography>
      <div className="reporte-poa-card-new">
        
        <div className="inputs-row">
          <FormControl fullWidth className="input-margin">
            <InputLabel id="tipo-proyecto-label" className="custom-label">
              Tipo de Proyecto
            </InputLabel>
            <Select
              labelId="tipo-proyecto-label"
              value={tipoProyecto}
              onChange={(e) => setTipoProyecto(e.target.value)}
              label="Tipo de Proyecto"
              className="custom-select"
            >
              <MenuItem value="">-- Selecciona tipo de proyecto --</MenuItem>
              {tiposProyecto.map((tipo) => (
                <MenuItem key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth className="input-margin">
            <InputLabel id="anio-label" className="custom-label">
              Año
            </InputLabel>
            <Select
              labelId="anio-label"
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
              label="Año"
              className="custom-select"
            >
              <MenuItem value="">-- Selecciona un año --</MenuItem>
              {Array.from({ length: 12 }, (_, i) => {
                const year = new Date().getFullYear() +3 - i;
                return (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </div>
        <Button
          variant="contained"
          className="reportepoa-custom-button"
          fullWidth
          onClick={handleGenerarReporte}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Generar Reporte"}
        </Button>

        
      </div>

              
      {reporteJson && (
        <div className="reporte-poa-card-new2">
          <div className="descarga-row">
            <Typography variant="h3" className="titulo-descarga" gutterBottom>
              Descargar Reporte
            </Typography>
            <div className="botones-descarga">
              <Button
                onClick={handleDescargar}
                className="reportepoa-custom-button-excel"
                startIcon={<img src={iconoExcel} alt="Excel" style={{  height: 32 }} />}
              >
                Excel
              </Button>
            </div>
          </div>
          </div>
        )}

        


      <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          
            position: "absolute", // Relativo al contenedor
            marginTop: "20px", // Espacio desde la parte superior
          }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
        </div>
    </div>
  );
};

export default ReportePOA;
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TablePagination,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  Autocomplete,
  Button,
} from "@mui/material";
import { historicoAPI, HistoricoProyecto, HistoricoPoa } from "../api/historicoAPI";

/**
 * Página de Logs del Sistema
 * 
 * Objetivo:
 *  Mostrar los históricos de modificaciones de proyectos y POAs
 * 
 * Parámetros:
 *  - No recibe parámetros
 * 
 * Operación:
 *  Renderiza dos tablas: una para histórico de proyectos y otra para histórico de POAs.
 *  Permite cambiar entre ambas mediante tabs y muestra paginación.
 */
const Logs: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [historicoProyectos, setHistoricoProyectos] = useState<HistoricoProyecto[]>([]);
  const [historicoPoas, setHistoricoPoas] = useState<HistoricoPoa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paginación para proyectos
  const [pageProyectos, setPageProyectos] = useState(0);
  const [rowsPerPageProyectos, setRowsPerPageProyectos] = useState(10);

  // Paginación para POAs
  const [pagePoas, setPagePoas] = useState(0);
  const [rowsPerPagePoas, setRowsPerPagePoas] = useState(10);

  // Filtros
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [usuarioFiltro, setUsuarioFiltro] = useState<string | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [proyectosData, poasData] = await Promise.all([
        historicoAPI.getHistoricoProyectos(0, 1000),
        historicoAPI.getHistoricoPoas(0, 1000)
      ]);
      setHistoricoProyectos(proyectosData || []);
      setHistoricoPoas(poasData || []);
      
      // Log para debugging
      console.log("Históricos cargados:", {
        proyectos: proyectosData?.length || 0,
        poas: poasData?.length || 0
      });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || "Error al cargar los históricos";
      setError(errorMessage);
      console.error("Error al cargar históricos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    try {
      const date = new Date(fecha);
      return date.toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fecha;
    }
  };

  // Obtener lista única de usuarios
  const usuariosUnicos = useMemo(() => {
    const usuarios = new Set<string>();
    historicoProyectos.forEach(h => usuarios.add(h.usuario));
    historicoPoas.forEach(h => usuarios.add(h.usuario));
    return Array.from(usuarios).sort();
  }, [historicoProyectos, historicoPoas]);

  // Función para filtrar por fecha y usuario
  const filtrarRegistros = <T extends { fecha_modificacion: string; usuario: string }>(
    registros: T[]
  ): T[] => {
    return registros.filter(registro => {
      // Filtrar por fecha de inicio
      if (fechaInicio) {
        const fechaRegistro = new Date(registro.fecha_modificacion);
        const fechaInicioDate = new Date(fechaInicio);
        if (fechaRegistro < fechaInicioDate) return false;
      }

      // Filtrar por fecha fin
      if (fechaFin) {
        const fechaRegistro = new Date(registro.fecha_modificacion);
        const fechaFinDate = new Date(fechaFin);
        // Agregar un día a fechaFin para incluir todo el día seleccionado
        fechaFinDate.setDate(fechaFinDate.getDate() + 1);
        if (fechaRegistro >= fechaFinDate) return false;
      }

      // Filtrar por usuario
      if (usuarioFiltro && registro.usuario !== usuarioFiltro) {
        return false;
      }

      return true;
    });
  };

  // Aplicar filtros
  const historicoProyectosFiltrados = useMemo(
    () => filtrarRegistros(historicoProyectos),
    [historicoProyectos, fechaInicio, fechaFin, usuarioFiltro]
  );

  const historicoPeasFiltrados = useMemo(
    () => filtrarRegistros(historicoPoas),
    [historicoPoas, fechaInicio, fechaFin, usuarioFiltro]
  );

  // Resetear paginación cuando cambian los filtros
  useEffect(() => {
    setPageProyectos(0);
    setPagePoas(0);
  }, [fechaInicio, fechaFin, usuarioFiltro]);

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFechaInicio("");
    setFechaFin("");
    setUsuarioFiltro(null);
  };

  // Paginación de proyectos
  const proyectosPaginados = historicoProyectosFiltrados.slice(
    pageProyectos * rowsPerPageProyectos,
    pageProyectos * rowsPerPageProyectos + rowsPerPageProyectos
  );

  // Paginación de POAs
  const poasPaginados = historicoPeasFiltrados.slice(
    pagePoas * rowsPerPagePoas,
    pagePoas * rowsPerPagePoas + rowsPerPagePoas
  );

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h3"
        align="center"
        gutterBottom
        sx={{ color: "#1d3557", fontWeight: 600, mb: 3 }}
      >
        Logs del Sistema
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Box sx={{ mb: 3, p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
          }}
        >
          <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
            <TextField
              label="Fecha Inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
          </Box>
          <Box sx={{ flex: "1 1 200px", minWidth: "200px" }}>
            <TextField
              label="Fecha Fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              size="small"
            />
          </Box>
          <Box sx={{ flex: "1 1 250px", minWidth: "250px" }}>
            <Autocomplete
              options={usuariosUnicos}
              value={usuarioFiltro}
              onChange={(_, newValue) => setUsuarioFiltro(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Usuario" size="small" />
              )}
              fullWidth
            />
          </Box>
          <Box sx={{ flex: "0 1 150px", minWidth: "150px" }}>
            <Button
              variant="outlined"
              onClick={limpiarFiltros}
              fullWidth
              sx={{ height: "40px" }}
            >
              Limpiar Filtros
            </Button>
          </Box>
        </Box>
      </Box>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label={`Histórico de Proyectos (${historicoProyectosFiltrados.length})`} />
        <Tab label={`Histórico de POAs (${historicoPeasFiltrados.length})`} />
      </Tabs>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Tabla de Histórico de Proyectos */}
          {tabValue === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Usuario</strong></TableCell>
                    <TableCell><strong>Código Proyecto</strong></TableCell>
                    <TableCell><strong>Campo Modificado</strong></TableCell>
                    <TableCell><strong>Valor Anterior</strong></TableCell>
                    <TableCell><strong>Valor Nuevo</strong></TableCell>
                    <TableCell><strong>Justificación</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proyectosPaginados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No hay registros históricos de proyectos
                      </TableCell>
                    </TableRow>
                  ) : (
                    proyectosPaginados.map((historico) => (
                      <TableRow key={historico.id_historico} hover>
                        <TableCell>{formatearFecha(historico.fecha_modificacion)}</TableCell>
                        <TableCell>{historico.usuario}</TableCell>
                        <TableCell>{historico.codigo_proyecto || "N/A"}</TableCell>
                        <TableCell>{historico.campo_modificado}</TableCell>
                        <TableCell sx={{ maxWidth: 200, wordBreak: "break-word" }}>
                          {historico.valor_anterior || "N/A"}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200, wordBreak: "break-word" }}>
                          {historico.valor_nuevo || "N/A"}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300, wordBreak: "break-word" }}>
                          {historico.justificacion}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={historicoProyectosFiltrados.length}
                page={pageProyectos}
                onPageChange={(_, newPage) => setPageProyectos(newPage)}
                rowsPerPage={rowsPerPageProyectos}
                onRowsPerPageChange={(e) => {
                  setRowsPerPageProyectos(parseInt(e.target.value, 10));
                  setPageProyectos(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Filas por página:"
              />
            </TableContainer>
          )}

          {/* Tabla de Histórico de POAs */}
          {tabValue === 1 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Usuario</strong></TableCell>
                    <TableCell><strong>Código Proyecto</strong></TableCell>
                    <TableCell><strong>Código POA</strong></TableCell>
                    <TableCell><strong>Campo Modificado</strong></TableCell>
                    <TableCell><strong>Valor Anterior</strong></TableCell>
                    <TableCell><strong>Valor Nuevo</strong></TableCell>
                    <TableCell><strong>Justificación</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {poasPaginados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No hay registros históricos de POAs
                      </TableCell>
                    </TableRow>
                  ) : (
                    poasPaginados.map((historico) => (
                      <TableRow key={historico.id_historico} hover>
                        <TableCell>{formatearFecha(historico.fecha_modificacion)}</TableCell>
                        <TableCell>{historico.usuario}</TableCell>
                        <TableCell>{historico.codigo_proyecto || "N/A"}</TableCell>
                        <TableCell>{historico.codigo_poa || "N/A"}</TableCell>
                        <TableCell>{historico.campo_modificado}</TableCell>
                        <TableCell sx={{ maxWidth: 200, wordBreak: "break-word" }}>
                          {historico.valor_anterior || "N/A"}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200, wordBreak: "break-word" }}>
                          {historico.valor_nuevo || "N/A"}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300, wordBreak: "break-word" }}>
                          {historico.justificacion}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={historicoPeasFiltrados.length}
                page={pagePoas}
                onPageChange={(_, newPage) => setPagePoas(newPage)}
                rowsPerPage={rowsPerPagePoas}
                onRowsPerPageChange={(e) => {
                  setRowsPerPagePoas(parseInt(e.target.value, 10));
                  setPagePoas(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Filas por página:"
              />
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
};

export default Logs;

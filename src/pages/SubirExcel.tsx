import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx"; // Importar la librería xlsx

import {
  Button,
  MenuItem,
  Select,
  Typography,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import iconoExcel from "../assets/icono-excel.png"; // Importa la imagen
import "../styles/SubirExcel.css"; // Importa el archivo CSS
import { projectAPI } from "../api/projectAPI"; // Importa el API
import { poaAPI } from "../api/poaAPI"; // Importa el API de POA
import { TipoProyecto } from "../interfaces/project";
import { POA } from "../interfaces/poa";
import { excelAPI } from "../api/excelAPI"; // Importa la función de subir Excel
import { sanitizeInput } from "../utils/sanitizer"; // Importación de sanitizador

// Resultado de la carga de un par (POA, hoja)
type ResultadoCarga = { texto: string; tipo: "ok" | "warning" | "error" };

const SubirExcel: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [opcion, setOpcion] = useState("");
  const [anio, setAnio] = useState("");
  const [tiposProyecto, setTiposProyecto] = useState<TipoProyecto[]>([]);
  const [poas, setPoas] = useState<POA[]>([]);
  const [poasSeleccionados, setPoasSeleccionados] = useState<string[]>([]); // POAs seleccionados (uno por hoja)
  const [nombresHojas, setNombresHojas] = useState<string[]>([]); // Hojas seleccionadas (una por POA)
  const [formTouched, setFormTouched] = useState(false);
  const [subiendo, setSubiendo] = useState(false); // Deshabilita el botón mientras se procesan las cargas
  const [errors, setErrors] = useState<{
    file?: string;
    poas?: string;
    hojas?: string;
  }>({});

  // Estados para el Snackbar
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<
    "success" | "error" | "warning" | "info"
  >("info");

  const [openDialog, setOpenDialog] = useState(false); // Estado para el diálogo de confirmación
  // Pares (POA, hoja) cuyo POA ya tiene actividades y esperan confirmación del usuario
  const [paresPendientes, setParesPendientes] = useState<
    { idPoa: string; hoja: string }[]
  >([]);
  // Resultados de los pares ya procesados, a la espera de resolver los pendientes
  const [resultadosParciales, setResultadosParciales] = useState<
    ResultadoCarga[]
  >([]);

  const [hojas, setHojas] = useState<string[]>([]); // Estado para los nombres de las hojas
  // Función para cerrar el Snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Función para extraer el prefijo del código POA
  const obtenerCodigoTipo = (codigoPoa: string): string | null => {
    const partes = codigoPoa.split("-");
    return partes.length > 0 ? partes[0] : null; // Retorna el prefijo (ejemplo: "PIGR")
  };
  // **Nuevo estado derivado para los POAs filtrados**
  const poasFiltrados = poas.filter((poa) => {
    // Buscar el tipo de proyecto seleccionado
    const tipoProyecto = tiposProyecto.find(
      (tipo) => tipo.id_tipo_proyecto === opcion
    );
    // Usar el codigo_tipo del tipo de proyecto seleccionado
    const codigoTipo = tipoProyecto ? tipoProyecto.codigo_tipo : null;

    // Aplicar los filtros
    const coincideTipo = codigoTipo
      ? obtenerCodigoTipo(poa.codigo_poa) === codigoTipo
      : true;
    const coincideAnio = anio ? poa.anio_ejecucion === String(anio) : true;

    return coincideTipo && coincideAnio;
  });

  // Cargar los tipos de proyecto al iniciar el componente
  useEffect(() => {
    const fetchTiposProyecto = async () => {
      try {
        const data = await projectAPI.getTiposProyecto();
        setTiposProyecto(data);
      } catch (err) {
        console.error("Error al obtener tipos de proyecto:", err);
      }
    };

    fetchTiposProyecto();
  }, []);

  // Cargar los POAs al iniciar el componente
  useEffect(() => {
    const fetchPOAs = async () => {
      try {
        const data = await poaAPI.getPOAs();
        setPoas(data);
      } catch (err) {
        console.error("Error al obtener POAs:", err);
      }
    };

    fetchPOAs();
  }, []);

  // Obtener el código legible de un POA a partir de su id
  const codigoDePoa = (idPoa: string): string =>
    poas.find((p) => p.id_poa === idPoa)?.codigo_poa || idPoa;

  // Elimina las 3 primeras columnas (izquierda a derecha) de todas las hojas del Excel
  const eliminarPrimerasColumnas = (data: Uint8Array, nombreArchivo: string): File => {
    // cellDates: true preserva las celdas de fecha como objetos Date (no como texto),
    // ya que el backend distingue explícitamente las columnas de fecha por su tipo.
    const workbook = XLSX.read(data, { type: "array", cellDates: true });

    workbook.SheetNames.forEach((nombreHoja) => {
      const hoja = workbook.Sheets[nombreHoja];
      const filas: unknown[][] = XLSX.utils.sheet_to_json(hoja, {
        header: 1,
        raw: true,
        defval: "",
      });
      const filasRecortadas = filas.map((fila) => fila.slice(3));
      workbook.Sheets[nombreHoja] = XLSX.utils.aoa_to_sheet(filasRecortadas, {
        cellDates: true,
      });
    });

    const wbout = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    return new File([wbout], nombreArchivo, {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  };

  // Validar automáticamente el formulario: archivo presente y misma cantidad de POAs y hojas
  useEffect(() => {
    const newErrors: {
      file?: string;
      poas?: string;
      hojas?: string;
    } = {};

    if (!file) {
      newErrors.file = "Debes seleccionar un archivo.";
    }
    if (poasSeleccionados.length === 0) {
      newErrors.poas = "Debes seleccionar al menos un POA.";
    }
    if (nombresHojas.length === 0) {
      newErrors.hojas = "Debes seleccionar al menos una hoja.";
    } else if (nombresHojas.length !== poasSeleccionados.length) {
      newErrors.hojas = `Debes seleccionar la misma cantidad de POAs y hojas (tienes ${poasSeleccionados.length} POA(s) y ${nombresHojas.length} hoja(s)).`;
    }
    setErrors(newErrors);
  }, [file, poasSeleccionados, nombresHojas]); // Ejecutar cada vez que cambie alguno de estos estados

  // Manejar el cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validExtensions = ["xls", "xlsx"];
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
      if (!fileExtension || !validExtensions.includes(fileExtension)) {
        setErrors((prev) => ({
          ...prev,
          file: "Debes seleccionar un archivo.",
        }));
        setMessage("Solo se aceptan archivos con extensión .xls o .xlsx.");
        setSeverity("error");
        setOpenSnackbar(true);
        setFile(null);
        setHojas([]); // Limpiar las hojas
        return;
      }
      setErrors((prev) => ({ ...prev, file: undefined }));

      // Leer el archivo Excel, eliminar las 3 primeras columnas de cada hoja y obtener los nombres de las hojas
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const archivoRecortado = eliminarPrimerasColumnas(data, selectedFile.name);
        setFile(archivoRecortado);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetNames = workbook.SheetNames; // Obtener los nombres de las hojas
        setHojas(sheetNames);
        setNombresHojas([]); // Reiniciar la selección de hojas al cambiar el archivo
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      const validExtensions = ["xls", "xlsx"];
      const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
      if (!fileExtension || !validExtensions.includes(fileExtension)) {
        setErrors((prev) => ({
          ...prev,
          file: "Debes seleccionar un archivo.",
        }));
        setMessage("Solo se aceptan archivos con extensión .xls o .xlsx.");
        setSeverity("error");
        setOpenSnackbar(true);
        setFile(null);
        return;
      }
      setErrors((prev) => ({ ...prev, file: undefined }));

      // Leer el archivo Excel, eliminar las 3 primeras columnas de cada hoja y obtener los nombres de las hojas
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const archivoRecortado = eliminarPrimerasColumnas(data, selectedFile.name);
        setFile(archivoRecortado);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetNames = workbook.SheetNames; // Obtener los nombres de las hojas
        setHojas(sheetNames);
        setNombresHojas([]); // Reiniciar la selección de hojas al cambiar el archivo
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setHojas([]); // Limpiar las hojas
    setNombresHojas([]); // Limpiar la selección de hojas
    setErrors((prev) => ({ ...prev, file: undefined }));
  };

  // Sube un par (POA, hoja) al backend con el archivo cargado.
  // Devuelve "pendiente" si el POA ya tiene actividades y el backend pide confirmación.
  const subirPar = async (
    idPoa: string,
    hoja: string,
    confirmacion: boolean
  ): Promise<ResultadoCarga | "pendiente"> => {
    const codigo = codigoDePoa(idPoa);
    const formData = new FormData();
    formData.append("file", file!);
    formData.append("id_poa", idPoa);
    formData.append("hoja", hoja);
    if (confirmacion) {
      formData.append("confirmacion", "true");
    }

    try {
      const data = await excelAPI.subirExcel(formData);

      if (data.requires_confirmation) {
        return "pendiente";
      }

      let texto = `${codigo} (hoja "${hoja}"): actividades y tareas creadas exitosamente.`;
      let tipo: "ok" | "warning" = "ok";

      // Verificar si hay warning de presupuesto
      if (data.warning && data.warning.excede_presupuesto) {
        texto = `${codigo} (hoja "${hoja}"): ${data.warning.mensaje}`;
        tipo = "warning";
      }

      // Si también hay otros errores, agregarlos
      if (data.errores && data.errores.length > 0) {
        texto += `\nAdvertencias adicionales: ${data.errores.join(" | ")}`;
        tipo = "warning";
      }

      return { texto, tipo };
    } catch (err: unknown) {
      const detalle =
        err && typeof err === "object" && "detail" in err
          ? String((err as { detail?: unknown }).detail)
          : undefined;
      return {
        texto: `${codigo} (hoja "${hoja}"): ${
          detalle || "Error al procesar el archivo."
        }`,
        tipo: "error",
      };
    }
  };

  // Muestra el resumen de todos los pares procesados y limpia el formulario si todo salió bien
  const mostrarResumen = (resultados: ResultadoCarga[]) => {
    const hayError = resultados.some((r) => r.tipo === "error");
    const hayWarning = resultados.some((r) => r.tipo === "warning");

    let severidad: "success" | "warning" | "error" = "success";
    if (hayError && resultados.every((r) => r.tipo === "error")) {
      severidad = "error";
    } else if (hayError || hayWarning) {
      severidad = "warning";
    }

    setMessage(resultados.map((r) => r.texto).join("\n"));
    setSeverity(severidad);
    setOpenSnackbar(true);

    // Limpiar formulario solo si todas las cargas fueron exitosas
    if (!hayError && !hayWarning) {
      setFile(null);
      setOpcion("");
      setAnio("");
      setPoasSeleccionados([]);
      setNombresHojas([]);
      setHojas([]);
      setFormTouched(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormTouched(true); // Marcar el formulario como tocado

    // Si hay errores, no enviar el formulario
    if (Object.keys(errors).length > 0) {
      setMessage("Por favor, corrige los errores antes de enviar.");
      setSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    setSubiendo(true);

    // Procesar cada par por orden de selección: el primer POA recibe la primera hoja, y así sucesivamente
    const resultados: ResultadoCarga[] = [];
    const pendientes: { idPoa: string; hoja: string }[] = [];

    for (let i = 0; i < poasSeleccionados.length; i++) {
      const idPoa = poasSeleccionados[i];
      const hoja = nombresHojas[i];
      const resultado = await subirPar(idPoa, hoja, false);
      if (resultado === "pendiente") {
        pendientes.push({ idPoa, hoja });
      } else {
        resultados.push(resultado);
      }
    }

    setSubiendo(false);

    if (pendientes.length > 0) {
      // Guardar el avance y pedir confirmación para los POAs que ya tienen actividades
      setResultadosParciales(resultados);
      setParesPendientes(pendientes);
      setOpenDialog(true);
    } else {
      mostrarResumen(resultados);
    }
  };

  const handleConfirm = async () => {
    if (paresPendientes.length === 0) return;

    setOpenDialog(false);
    setSubiendo(true);

    const resultados: ResultadoCarga[] = [...resultadosParciales];
    for (const par of paresPendientes) {
      const resultado = await subirPar(par.idPoa, par.hoja, true);
      // Con confirmación explícita el backend no vuelve a pedirla
      if (resultado !== "pendiente") {
        resultados.push(resultado);
      }
    }

    setSubiendo(false);
    setParesPendientes([]);
    setResultadosParciales([]);
    mostrarResumen(resultados);
  };

  const handleCancel = () => {
    setOpenDialog(false);

    // Los pares no confirmados se reportan como omitidos
    const omitidos: ResultadoCarga[] = paresPendientes.map((par) => ({
      texto: `${codigoDePoa(par.idPoa)} (hoja "${par.hoja}"): omitido, el POA conserva sus actividades actuales.`,
      tipo: "warning" as const,
    }));

    const resultados = [...resultadosParciales, ...omitidos];
    setParesPendientes([]);
    setResultadosParciales([]);

    if (resultados.length > 0) {
      mostrarResumen(resultados);
    }
  };

  return (
    <div className="subir-excel-wrapper">
      <h1 className="titulo-subir-excel">Subir archivo Excel</h1>
      <div className="subir-excel-card">
        <form onSubmit={handleSubmit}>
          {/* Selector de tipos de proyecto */}
          <FormControl fullWidth className="input-margin">
            <InputLabel id="opcion-label" className="custom-label">
              Seleccione tipo de Proyecto
            </InputLabel>
            <Select
              labelId="opcion-label"
              value={opcion}
              onChange={(e) => setOpcion(sanitizeInput(e.target.value))}
              label="Seleccione tipo de Proyecto"
              className="custom-select"
              renderValue={(selected) => {
                if (selected === "") {
                  return "-- Todos los tipos de proyecto --"; // Texto cuando está vacío
                }
                const tipoProyecto = tiposProyecto.find(
                  (tipo) => tipo.id_tipo_proyecto === selected
                );
                return tipoProyecto
                  ? `${tipoProyecto.codigo_tipo} - ${tipoProyecto.nombre}`
                  : "";
              }}
            >
              <MenuItem value="">-- Todos los tipos de proyecto --</MenuItem>{" "}
              {/* Opción para limpiar */}
              {tiposProyecto.map((tipo) => (
                <MenuItem
                  key={tipo.id_tipo_proyecto}
                  value={tipo.id_tipo_proyecto}
                >
                  {`${tipo.codigo_tipo} - ${tipo.nombre}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {/* Selector de año */}
          <FormControl fullWidth className="input-margin">
            <InputLabel id="anio-label" className="custom-label">
              Selecciona un año
            </InputLabel>
            <Select
              labelId="anio-label"
              value={anio}
              onChange={(e) => setAnio(sanitizeInput(e.target.value))}
              label="Selecciona un año"
              className="custom-select"
            >
              <MenuItem value="">-- Todos los años --</MenuItem>{" "}
              {/* Opción para limpiar */}
              {Array.from({ length: 12 }, (_, i) => {
                const year = new Date().getFullYear() + 3 - i;
                return (
                  <MenuItem key={year} value={String(year)}>
                    {year}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Selector de POA (selección múltiple, uno por hoja del Excel) */}
          <FormControl fullWidth className="input-margin">
            <InputLabel id="poa-label" className="custom-label">
              Seleccione POA(s)
            </InputLabel>
            <Select
              labelId="poa-label"
              multiple
              value={poasSeleccionados}
              onChange={(e) => {
                const value = e.target.value;
                const seleccion =
                  typeof value === "string" ? value.split(",") : value;
                setPoasSeleccionados(seleccion.map((v) => sanitizeInput(v)));
              }}
              label="Seleccione POA(s)"
              className="custom-select"
              renderValue={(selected) =>
                (selected as string[]).map((id) => codigoDePoa(id)).join(", ")
              }
            >
              {poasFiltrados.map((poa) => (
                <MenuItem key={poa.id_poa} value={poa.id_poa}>
                  {poa.codigo_poa}
                </MenuItem>
              ))}
            </Select>
            {formTouched && errors.poas && (
              <Typography color="error">{errors.poas}</Typography>
            )}
          </FormControl>

          {/* Área de carga de archivos */}
          {file ? (
            <div className="file-preview">
              <Button className="remove-button" onClick={handleRemoveFile}>
                ✖
              </Button>
              <img src={iconoExcel} alt="Excel" className="icono-excel" />
              <Typography>{file.name}</Typography>
            </div>
          ) : (
            <div
              className="file-dropzone"
              onClick={() => document.getElementById("fileInput")?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              Arrastra tu archivo aquí o haz clic para seleccionarlo
              <input
                type="file"
                id="fileInput"
                name="file"
                accept=".xls,.xlsx"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>
          )}
          {formTouched && errors.file && (
            <Typography color="error">{errors.file}</Typography>
          )}
          {/* Selector para los nombres de las hojas (selección múltiple, una por POA) */}
          {file && hojas.length > 0 && (
            <FormControl
              fullWidth
              className="input-margin"
              sx={{ marginTop: "20px" }}
            >
              <InputLabel
                id="hoja-label"
                className="custom-label"
                sx={{ marginBottom: "0px" }}
              >
                Seleccione las hojas
              </InputLabel>
              <Select
                labelId="hoja-label"
                multiple
                value={nombresHojas}
                onChange={(e) => {
                  const value = e.target.value;
                  const seleccion =
                    typeof value === "string" ? value.split(",") : value;
                  setNombresHojas(seleccion.map((v) => sanitizeInput(v)));
                }}
                label="Seleccione las hojas"
                className="custom-select2"
                renderValue={(selected) => (selected as string[]).join(", ")}
              >
                {hojas.map((hoja, index) => (
                  <MenuItem key={index} value={hoja}>
                    {hoja}
                  </MenuItem>
                ))}
              </Select>
              {/* Mensaje de error si la cantidad de hojas no coincide con la de POAs */}
              {formTouched && errors.hojas && (
                <Typography color="error">{errors.hojas}</Typography>
              )}
            </FormControl>
          )}

          {/* Vista previa del emparejamiento: cada hoja se carga en el POA del mismo orden de selección */}
          {poasSeleccionados.length > 0 && nombresHojas.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <Typography variant="subtitle2">
                Así se cargarán las hojas en los POAs:
              </Typography>
              {poasSeleccionados.map((idPoa, i) => (
                <Typography key={idPoa} variant="body2">
                  {`${codigoDePoa(idPoa)}  ⟵  ${
                    nombresHojas[i] || "(sin hoja asignada)"
                  }`}
                </Typography>
              ))}
            </div>
          )}

          {/* Botón de subir */}
          <Button
            type="submit"
            variant="contained"
            className="custom-button"
            fullWidth
            disabled={subiendo}
          >
            {subiendo ? "Subiendo..." : "Subir"}
          </Button>
        </form>
      </div>

      {/* Snackbar para mostrar mensajes */}
      {/* Contenedor relativo para el Snackbar */}
      <div style={{ position: "relative", height: "100%", width: "100%" }}>
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{
            position: "absolute", // Relativo al contenedor
            top: "30%", // Ajustar la posición vertical
            left: "50%", // Centrar horizontalmente
            transform: "translate(-50%, -50%)", // Ajustar para centrar completamente
          }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={severity}
            sx={{ width: "100%" }}
          >
            <Typography sx={{ whiteSpace: "pre-line" }}>{message}</Typography>
          </Alert>
        </Snackbar>
      </div>
      {/* Diálogo de confirmación */}
      <Dialog open={openDialog} onClose={handleCancel}>
        <DialogTitle>Confirmación requerida</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Los siguientes POAs ya tienen actividades asociadas: ${paresPendientes
              .map((par) => codigoDePoa(par.idPoa))
              .join(", ")}. ¿Deseas reemplazarlas con las nuevas actividades del Excel?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} sx={{ color: "red" }}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            sx={{
              backgroundColor: "#28497b", // Cambiar el color de fondo
              color: "white", // Cambiar el color del texto a blanco
              "&:hover": {
                backgroundColor: "#182c4a", // Cambiar el color de fondo al pasar el mouse
              },
            }}
          >
            Reemplazar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SubirExcel;

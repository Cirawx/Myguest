import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/authStore";
import { getDashboardData } from "../../services/dashboardService";
import styles from "./DashboardPage.module.css";
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,Cell,} from "recharts";

const DashboardPage = () => {
  const { isDark } = useThemeStore();
  const { token, usuario } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getDashboardData(token);
        setData(result);
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const tarjetas = [
    {
      label: "Total Productos",
      value: data?.totalProductos,
      icon: "📦",
      color: "#22c55e",
    },
    {
      label: "Stock Crítico",
      value: data?.stockCritico,
      icon: "⚠️",
      color: "#ef4444",
      alerta: true,
    },
    {
      label: "Total Usuarios",
      value: data?.totalUsuarios,
      icon: "👤",
      color: "#8b5cf6",
    },
    {
      label: "Proveedores",
      value: data?.totalProveedores,
      icon: "🏭",
      color: "#f59e0b",
    },
  ];
  

  return (
    <MainLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1
              className={`${styles.title} ${isDark ? styles.dark : styles.light}`}
            >
              Dashboard
            </h1>
            <p className={styles.subtitle}>Vista general del sistema</p>
          </div>
          <div className={styles.bienvenida}>
            <span className={styles.bienvenidaTexto}>Bienvenido,</span>
            <span
              className={`${styles.bienvenidaNombre} ${isDark ? styles.dark : styles.light}`}
            >
              {usuario?.nom} {usuario?.primer_apellido}
            </span>
          </div>
        </div>

        {/* Tarjetas */}
        <div className={styles.tarjetas}>
          {tarjetas.map((t) => (
            <div
              key={t.label}
              className={`${styles.tarjeta} ${t.alerta ? styles.tarjetaAlerta : isDark ? styles.tarjetaDark : styles.tarjetaLight}`}
            >
              <div className={styles.tarjetaLeft}>
                <p className={styles.tarjetaLabel}>{t.label}</p>
                <p
                  className={`${styles.tarjetaValue} ${t.alerta ? styles.tarjetaAlertaValue : isDark ? styles.dark : styles.light}`}
                >
                  {loading ? "..." : t.value}
                </p>
              </div>
              <div
                className={styles.tarjetaIcon}
                style={{ backgroundColor: t.color + "22" }}
              >
                <span style={{ fontSize: "24px" }}>{t.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Gráfico */}
        {!loading && data?.stockBajo && (
          <div
            className={`${styles.graficoCard} ${isDark ? styles.tarjetaDark : styles.tarjetaLight}`}
          >
            <h2
              className={`${styles.alertasTitle} ${isDark ? styles.dark : styles.light}`}
            >
              📊 Productos con Menor Stock
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.stockBajo}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
              >
                <XAxis type="number" stroke="#6b7280" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="nombre_producto"
                  stroke="#6b7280"
                  fontSize={11}
                  width={150}
                  tickFormatter={(v) =>
                    v?.length > 20 ? v.substring(0, 20) + "..." : v
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? "#1f2937" : "#ffffff",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: isDark ? "#ffffff" : "#111827",
                  }}
                  formatter={(value) => [value, "Stock actual"]}
                />
                <Bar dataKey="stock_actual" radius={[0, 6, 6, 0]}>
                  {data.stockBajo.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.stock_actual <= entry.stock_minimo
                          ? "#ef4444"
                          : "#22c55e"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Contenido principal */}
        {/* Alertas de stock */}
        <div
          className={`${styles.alertasCard} ${isDark ? styles.tarjetaDark : styles.tarjetaLight}`}
        >
          <div className={styles.alertasHeader}>
            <h2
              className={`${styles.alertasTitle} ${isDark ? styles.dark : styles.light}`}
            >
              ⚠️ Alertas de Stock Crítico
            </h2>
            <span className={styles.alertasBadge}>
              {loading ? "..." : data?.stockCritico}
            </span>
          </div>

          <div className={styles.alertasList}>
            {loading ? (
              <p className={styles.loadingText}>Cargando alertas...</p>
            ) : data?.alertas?.length === 0 ? (
              <p className={styles.emptyText}>
                ✅ No hay productos con stock crítico
              </p>
            ) : (
              data?.alertas?.map((alerta) => (
                <div
                  key={alerta.id_producto}
                  className={`${styles.alertaItem} ${isDark ? styles.alertaItemDark : styles.alertaItemLight}`}
                >
                  <div className={styles.alertaInfo}>
                    <p
                      className={`${styles.alertaNombre} ${isDark ? styles.dark : styles.light}`}
                    >
                      {alerta.nombre_producto}
                    </p>
                    <p className={styles.alertaDetalle}>
                      Stock actual: <strong>{alerta.stock_actual}</strong> —
                      Mínimo: <strong>{alerta.stock_minimo}</strong>
                    </p>
                  </div>
                  <span className={styles.alertaTag}>Crítico</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Módulos del sistema */}
        <div className={styles.modulosSection}>
          <h2
            className={`${styles.alertasTitle} ${isDark ? styles.dark : styles.light}`}
          >
            Módulos del Sistema
          </h2>
          <div className={styles.modulosGrid}>
            {[
              {
                label: "Usuarios",
                icon: "👤",
                path: "/usuarios",
                descripcion: "Gestión de accesos y roles",
                disponible: true,
                count: data?.totalUsuarios,
              },
              {
                label: "Inventario",
                icon: "📦",
                path: "/inventario",
                descripcion: "Control de stock y productos",
                disponible: true,
                count: data?.totalProductos,
              },
              {
                label: "Proveedores",
                icon: "🏭",
                path: "/proveedores",
                descripcion: "Gestión de proveedores",
                disponible: true,
                count: data?.totalProveedores,
              },
              {
                label: "Compras",
                icon: "🛒",
                path: "/compras",
                descripcion: "Órdenes y proveedores",
                disponible: false,
              },
              {
                label: "Facturación",
                icon: "📄",
                path: "/facturacion",
                descripcion: "Documentos tributarios",
                disponible: false,
              },
              {
                label: "Mermas",
                icon: "🗑️",
                path: "/mermas",
                descripcion: "Control de pérdidas",
                disponible: false,
              },
            ].map((modulo) => (
              <div
                key={modulo.label}
                onClick={() => modulo.disponible && navigate(modulo.path)}
                className={`${styles.moduloCard} ${isDark ? styles.moduloCardDark : styles.moduloCardLight} ${!modulo.disponible ? styles.moduloDeshabilitado : ""}`}
              >
                {modulo.count !== undefined && modulo.disponible && (
                  <span className={styles.moduloCount}>{modulo.count}</span>
                )}
                <span className={styles.moduloCardIcon}>{modulo.icon}</span>
                <p
                  className={`${styles.moduloCardLabel} ${isDark ? styles.dark : styles.light}`}
                >
                  {modulo.label}
                </p>
                <p className={styles.moduloCardDesc}>{modulo.descripcion}</p>
                {!modulo.disponible && (
                  <span className={styles.proximamente}>Próximamente</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;

/**
 * Point d'entrée public du module Finance.
 * Importer depuis ici pour éviter des chemins profonds.
 *
 * Exemple :
 *   import { KpiCard, Spinner } from "@/admin/components/finance";
 */
export { default as KpiCard }          from "./ui/KpiCard.jsx";
export { default as Pill }             from "./ui/Pill.jsx";
export { default as Spinner }          from "./ui/Spinner.jsx";
export { default as Breadcrumb }       from "./ui/Breadcrumb.jsx";
export { default as Pagination }       from "./ui/Pagination.jsx";
export { default as PayModal }         from "./ui/PayModal.jsx";
export { default as BarChart }         from "./charts/BarChart.jsx";
export { default as DonutChart }       from "./charts/DonutChart.jsx";
export { default as FinanceHeader }    from "./FinanceHeader.jsx";
export { default as FinanceTabs }      from "./FinanceTabs.jsx";
export { default as RevenusKpis }      from "./RevenusKpis.jsx";
export { default as RevenusFilters }   from "./RevenusFilters.jsx";
export { default as RevenusTable }     from "./RevenusTable.jsx";
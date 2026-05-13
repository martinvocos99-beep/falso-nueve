import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const COLORS = {
  bg:"#0B0B0B", surface:"#151515", card:"#1A1A1A", border:"#252525",
  gold:"#C8A86B", green:"#B7FF00", white:"#FFFFFF", gray:"#777777",
  grayLight:"#AAAAAA", red:"#FF4444", blue:"#4A9EFF", purple:"#A855F7",
};

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const CATEGORIAS_STOCK = ["Shorts","Camisetas","Medias","Buzos","Buzos Medio Cierre","Camperas","Pantalón Largo","Otros"];
const TALLES = ["XS","S","M","L","XL","XXL","Único"];
const CANALES = ["Local","WhatsApp","Mayor","Pedido personalizado"];
const PAGOS = ["Efectivo","Transferencia"];
const CAT_GASTOS = ["Insumos","Servicios","Transporte","Art. Limpieza","Otros"];
const ESTADOS_PEDIDO = ["Pendiente","En producción","Listo para entregar","Entregado"];

// ─── Firebase helpers ───
async function loadFB(key) {
  try {
    const snap = await getDoc(doc(db, "falsonueve", key));
    return snap.exists() ? snap.data().value : [];
  } catch { return []; }
}
async function saveFB(key, data) {
  try { await setDoc(doc(db, "falsonueve", key), { value: data }); } catch(e) { console.error(e); }
}

const fmt = n => `$${Number(n||0).toLocaleString("es-AR")}`;
const fmtDate = d => { try { return new Date(d).toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"2-digit"}); } catch { return ""; }};
const nowISO = () => new Date().toISOString();
const todayStr = () => new Date().toISOString().split("T")[0];

// ─── ICONS ───
const PATHS = {
  home:["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M9 22V12h6v10"],
  box:["M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z","M3.27 6.96L12 12.01l8.73-5.05","M12 22.08V12"],
  trend:["M23 6L13.5 15.5 8.5 10.5 1 18","M17 6h6v6"],
  minus:["M5 12h14"],
  cart:["M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z","M3 6h18","M16 10a4 4 0 0 1-8 0"],
  clip:["M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2","M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2","M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2"],
  x:["M18 6L6 18","M6 6l12 12"],
  trash:["M3 6h18","M19 6l-1 14H6L5 6","M10 11v6","M14 11v6","M9 6V4h6v2"],
  chev_l:["M15 18l-6-6 6-6"],
  chev_r:["M9 18l6-6-6-6"],
  alert:["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4","M12 17h.01"],
  check:["M20 6L9 17l-5-5"],
  star:["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"],
};
const I = ({ n, s=18, c=COLORS.gold }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {(PATHS[n]||[]).map((d,i)=><path key={i} d={d}/>)}
  </svg>
);

// ─── UI PRIMITIVES ───
const Card = ({ children, style={}, gold=false }) => (
  <div style={{ background:COLORS.card, border:`1px solid ${gold?COLORS.gold+"44":COLORS.border}`, borderRadius:14, padding:"14px 16px", ...style }}>{children}</div>
);
const Label = ({ children }) => (
  <div style={{ color:COLORS.grayLight, fontSize:10, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1.5, marginBottom:5 }}>{children}</div>
);
const Inp = ({ label, value, onChange, type="text", placeholder="" }) => (
  <div style={{ marginBottom:12 }}>
    {label && <Label>{label}</Label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{ width:"100%", background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:8,
        padding:"9px 13px", color:COLORS.white, fontSize:13, fontFamily:"'Montserrat',sans-serif", outline:"none", boxSizing:"border-box" }} />
  </div>
);
const Sel = ({ label, value, onChange, opts=[] }) => (
  <div style={{ marginBottom:12 }}>
    {label && <Label>{label}</Label>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ width:"100%", background:COLORS.surface, border:`1px solid ${COLORS.border}`, borderRadius:8,
        padding:"9px 13px", color:COLORS.white, fontSize:13, fontFamily:"'Montserrat',sans-serif", outline:"none", boxSizing:"border-box" }}>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);
const Btn = ({ children, onClick, bg=COLORS.gold, tc="#000", full=true, small=false }) => (
  <button onClick={onClick} style={{ background:bg, color:tc, border:"none", borderRadius:8,
    padding:small?"7px 14px":"11px 18px", fontFamily:"'Bebas Neue',sans-serif",
    fontSize:small?12:15, letterSpacing:1, cursor:"pointer", width:full?"100%":"auto" }}>
    {children}
  </button>
);
const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ background:active?COLORS.gold:COLORS.surface,
    color:active?"#000":COLORS.grayLight, border:`1px solid ${active?COLORS.gold:COLORS.border}`,
    borderRadius:20, padding:"5px 12px", fontSize:11, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1, cursor:"pointer" }}>
    {label}
  </button>
);
const Modal = ({ title, onClose, children }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:200,
    display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
    <div style={{ background:COLORS.card, border:`1px solid ${COLORS.border}`, borderRadius:18,
      width:"100%", maxWidth:430, maxHeight:"92vh", overflowY:"auto" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px", borderBottom:`1px solid ${COLORS.border}` }}>
        <span style={{ color:COLORS.gold, fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:1 }}>{title}</span>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}><I n="x" s={16} c={COLORS.gray}/></button>
      </div>
      <div style={{ padding:18 }}>{children}</div>
    </div>
  </div>
);
const StatCard = ({ label, value, color, icon }) => (
  <Card style={{ flex:1, minWidth:140 }}>
    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
      <I n={icon} s={14} c={color}/><span style={{ color:COLORS.gray, fontSize:9, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1.5 }}>{label}</span>
    </div>
    <div style={{ color, fontFamily:"'Bebas Neue',sans-serif", fontSize:21 }}>{value}</div>
  </Card>
);
const SectionTitle = ({ children }) => (
  <div style={{ color:COLORS.gold, fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:1, marginBottom:14 }}>{children}</div>
);
const SubTitle = ({ children }) => (
  <div style={{ color:COLORS.gray, fontFamily:"'Bebas Neue',sans-serif", fontSize:11, letterSpacing:2, marginBottom:8 }}>{children}</div>
);
const EmptyState = ({ text }) => (
  <div style={{ color:COLORS.gray, fontSize:12, fontFamily:"'Montserrat',sans-serif", textAlign:"center", padding:"40px 0" }}>{text}</div>
);

// ─── INICIO ───
function Inicio({ stock, ventas, gastos, compras, pedidos }) {
  const now = new Date();
  const [filtroActivo, setFiltroActivo] = useState(false);
  const [mes, setMes] = useState(now.getMonth());
  const [anio, setAnio] = useState(now.getFullYear());

  const totalVentasGral = ventas.reduce((s,v)=>s+Number(v.total),0);
  const totalGastosGral = gastos.reduce((s,g)=>s+Number(g.monto),0);
  const totalComprasGral = compras.reduce((s,c)=>s+Number(c.total),0);
  const gananciaGral = totalVentasGral - totalGastosGral - totalComprasGral;

  const inMes = arr => arr.filter(x => { const d=new Date(x.fecha||x.fechaSeña||""); return d.getMonth()===mes&&d.getFullYear()===anio; });
  const vMes=inMes(ventas), gMes=inMes(gastos), cMes=inMes(compras);
  const tVM=vMes.reduce((s,v)=>s+Number(v.total),0);
  const tGM=gMes.reduce((s,g)=>s+Number(g.monto),0);
  const tCM=cMes.reduce((s,c)=>s+Number(c.total),0);
  const ganMes=tVM-tGM-tCM;

  const ventasBase = filtroActivo ? vMes : ventas;
  const conteo = {};
  ventasBase.forEach(v=>{ conteo[v.producto]=(conteo[v.producto]||0)+Number(v.cantidad); });
  const masVendido = Object.entries(conteo).sort((a,b)=>b[1]-a[1])[0];

  const stockBajo = stock.filter(p=>Number(p.cantidad)<=3);
  const pedPendientes = pedidos.filter(p=>p.estado!=="Entregado");
  const esMesActual = mes===now.getMonth()&&anio===now.getFullYear();
  const navMes = delta => { let m=mes+delta,a=anio; if(m<0){m=11;a--;} if(m>11){m=0;a++;} setMes(m);setAnio(a); };

  const tV=filtroActivo?tVM:totalVentasGral;
  const tG=filtroActivo?tGM+tCM:totalGastosGral+totalComprasGral;
  const tN=filtroActivo?ganMes:gananciaGral;

  return (
    <div style={{ paddingBottom:20 }}>
      <div style={{ padding:"20px 16px 12px", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:48, height:48, borderRadius:"50%", border:`2px solid ${COLORS.gold}`, background:"#1A1A1A", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <span style={{ color:COLORS.gold, fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:1 }}>F9</span>
        </div>
        <div>
          <div style={{ color:COLORS.gold, fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:1 }}>FALSO NUEVE</div>
          <div style={{ color:COLORS.gray, fontSize:11 }}>Panel de control</div>
        </div>
      </div>

      <div style={{ display:"flex", gap:10, padding:"0 16px", flexWrap:"wrap" }}>
        <StatCard label="VENDIDO" value={fmt(tV)} color={COLORS.green} icon="trend"/>
        <StatCard label="GASTOS + COMPRAS" value={fmt(tG)} color={COLORS.red} icon="minus"/>
      </div>
      <div style={{ padding:"10px 16px 0" }}>
        <StatCard label="GANANCIA NETA" value={fmt(tN)} color={tN>=0?COLORS.gold:COLORS.red} icon="star"/>
      </div>

      <div style={{ padding:"14px 16px 0" }}>
        <button onClick={()=>setFiltroActivo(!filtroActivo)}
          style={{ background:filtroActivo?COLORS.gold:COLORS.surface, color:filtroActivo?"#000":COLORS.grayLight,
            border:`1px solid ${filtroActivo?COLORS.gold:COLORS.border}`, borderRadius:20,
            padding:"6px 14px", fontSize:11, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:1, cursor:"pointer" }}>
          {filtroActivo?"✕ QUITAR FILTRO":"FILTRAR POR MES"}
        </button>
      </div>

      {filtroActivo && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px 0" }}>
          <button onClick={()=>navMes(-1)} style={{ background:"none",border:"none",cursor:"pointer",padding:4 }}><I n="chev_l" s={20} c={COLORS.gold}/></button>
          <div style={{ textAlign:"center" }}>
            <div style={{ color:COLORS.white, fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:1 }}>{MESES[mes]} {anio}</div>
            {!esMesActual && <div style={{ color:COLORS.gray, fontSize:10 }}>mes anterior</div>}
          </div>
          <button onClick={()=>navMes(1)} disabled={esMesActual} style={{ background:"none",border:"none",cursor:"pointer",padding:4,opacity:esMesActual?0.2:1 }}><I n="chev_r" s={20} c={COLORS.gold}/></button>
        </div>
      )}

      {masVendido && (
        <div style={{ margin:"12px 16px 0" }}>
          <Card gold>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
              <I n="star" s={13} c={COLORS.gold}/><Label>PRODUCTO MÁS VENDIDO {filtroActivo?`— ${MESES[mes]}`:"— GENERAL"}</Label>
            </div>
            <div style={{ color:COLORS.white, fontSize:13, fontFamily:"'Montserrat',sans-serif", fontWeight:600 }}>{masVendido[0]}</div>
            <div style={{ color:COLORS.gold, fontFamily:"'Bebas Neue',sans-serif", fontSize:18 }}>{masVendido[1]} unidades</div>
          </Card>
        </div>
      )}

      {stockBajo.length>0 && (
        <div style={{ margin:"12px 16px 0" }}>
          <Card style={{ border:`1px solid ${COLORS.red}44`, background:"#FF444410" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
              <I n="alert" s={13} c={COLORS.red}/><Label>STOCK BAJO</Label>
            </div>
            {stockBajo.map(p=>(
              <div key={p.id} style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ color:COLORS.white, fontSize:12 }}>{p.nombre} T.{p.talle}</span>
                <span style={{ color:COLORS.red, fontFamily:"'Bebas Neue',sans-serif", fontSize:14 }}>{p.cantidad} ud.</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {pedPendientes.length>0 && (
        <div style={{ margin:"12px 16px 0" }}>
          <Card style={{ border:`1px solid ${COLORS.purple}44` }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
              <I n="clip" s={13} c={COLORS.purple}/><Label>PEDIDOS ACTIVOS</Label>
            </div>
            {pedPendientes.map(p=>(
              <div key={p.id} style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ color:COLORS.white, fontSize:12 }}>{p.cliente}</span>
                <span style={{ color:COLORS.purple, fontFamily:"'Bebas Neue',sans-serif", fontSize:11 }}>{p.estado}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      <div style={{ padding:"16px 16px 0" }}>
        <SubTitle>ÚLTIMAS VENTAS {filtroActivo?`— ${MESES[mes]}`:"— GENERAL"}</SubTitle>
        {ventasBase.length===0 ? <EmptyState text="Sin ventas registradas"/> : ventasBase.slice(0,5).map(v=>(
          <div key={v.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:`1px solid ${COLORS.border}` }}>
            <div>
              <div style={{ color:COLORS.white, fontSize:13, fontWeight:600 }}>{v.producto}</div>
              <div style={{ color:COLORS.gray, fontSize:11 }}>{fmtDate(v.fecha)} · {v.cantidad} ud. · {v.canal} · {v.pago}</div>
            </div>
            <div style={{ color:COLORS.green, fontFamily:"'Bebas Neue',sans-serif", fontSize:16 }}>{fmt(v.total)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── STOCK ───
function Stock({ stock, setStock }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre:"", categoria:CATEGORIAS_STOCK[0], categoriaOtros:"", talle:"M", cantidad:"", costo:"", precioVenta:"" });
  const [filtro, setFiltro] = useState("Todos");
  const cats = ["Todos",...CATEGORIAS_STOCK];
  const visible = filtro==="Todos" ? stock : stock.filter(p=>p.categoria===filtro);

  const agregar = async () => {
    if(!form.nombre||!form.cantidad) return;
    const catFinal = form.categoria==="Otros"&&form.categoriaOtros ? form.categoriaOtros : form.categoria;
    const existe = stock.find(p=>p.nombre===form.nombre&&p.talle===form.talle);
    let nuevo;
    if(existe) { nuevo = stock.map(p=>p.id===existe.id?{...p,cantidad:Number(p.cantidad)+Number(form.cantidad)}:p); }
    else { nuevo = [...stock, {...form, categoria:catFinal, id:Date.now()}]; }
    setStock(nuevo); await saveFB("stock", nuevo);
    setModal(false); setForm({ nombre:"", categoria:CATEGORIAS_STOCK[0], categoriaOtros:"", talle:"M", cantidad:"", costo:"", precioVenta:"" });
  };

  const ajustar = async (id, delta) => {
    const nuevo = stock.map(p=>p.id===id?{...p,cantidad:Math.max(0,Number(p.cantidad)+delta)}:p);
    setStock(nuevo); await saveFB("stock", nuevo);
  };

  const eliminar = async id => {
    const nuevo = stock.filter(p=>p.id!==id);
    setStock(nuevo); await saveFB("stock", nuevo);
  };

  return (
    <div style={{ padding:"20px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <SectionTitle>STOCK</SectionTitle>
        <Btn onClick={()=>setModal(true)} full={false} small>+ AGREGAR</Btn>
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        {cats.map(c=><Pill key={c} label={c} active={filtro===c} onClick={()=>setFiltro(c)}/>)}
      </div>
      {visible.length===0 && <EmptyState text="Sin productos en esta categoría"/>}
      {visible.map(p=>(
        <div key={p.id} style={{ background:COLORS.card, border:`1px solid ${Number(p.cantidad)===0?COLORS.red+"66":Number(p.cantidad)<=3?COLORS.red+"44":COLORS.border}`, borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ flex:1 }}>
              <div style={{ color:COLORS.white, fontSize:13, fontWeight:600 }}>{p.nombre}</div>
              <div style={{ color:COLORS.gray, fontSize:11 }}>Talle {p.talle} · {p.categoria}</div>
              <div style={{ color:COLORS.grayLight, fontSize:11, marginTop:2 }}>Costo: {fmt(p.costo)} · Venta: {fmt(p.precioVenta)}</div>
            </div>
            <button onClick={()=>eliminar(p.id)} style={{ background:"none",border:"none",cursor:"pointer",padding:4 }}><I n="trash" s={13} c={COLORS.gray}/></button>
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={()=>ajustar(p.id,-1)} style={{ background:COLORS.surface,border:`1px solid ${COLORS.border}`,borderRadius:6,width:28,height:28,color:COLORS.white,fontSize:16,cursor:"pointer" }}>−</button>
              <span style={{ color:Number(p.cantidad)===0?COLORS.red:Number(p.cantidad)<=3?COLORS.red:COLORS.green, fontFamily:"'Bebas Neue',sans-serif", fontSize:22, minWidth:28, textAlign:"center" }}>{p.cantidad}</span>
              <button onClick={()=>ajustar(p.id,1)} style={{ background:COLORS.surface,border:`1px solid ${COLORS.border}`,borderRadius:6,width:28,height:28,color:COLORS.white,fontSize:16,cursor:"pointer" }}>+</button>
            </div>
            <span style={{ color:COLORS.gray, fontSize:11 }}>unidades</span>
          </div>
        </div>
      ))}
      {modal && (
        <Modal title="AGREGAR PRODUCTO" onClose={()=>setModal(false)}>
          <Inp label="NOMBRE DEL PRODUCTO" value={form.nombre} onChange={v=>setForm({...form,nombre:v})} placeholder="Ej: Short AFA Negro"/>
          <Sel label="CATEGORÍA" value={form.categoria} onChange={v=>setForm({...form,categoria:v})} opts={CATEGORIAS_STOCK}/>
          {form.categoria==="Otros" && <Inp label="ESPECIFICÁ LA CATEGORÍA" value={form.categoriaOtros} onChange={v=>setForm({...form,categoriaOtros:v})} placeholder="Ej: Gorras, Medias largas..."/>}
          <Sel label="TALLE" value={form.talle} onChange={v=>setForm({...form,talle:v})} opts={TALLES}/>
          <Inp label="CANTIDAD" value={form.cantidad} onChange={v=>setForm({...form,cantidad:v})} type="number" placeholder="0"/>
          <Inp label="COSTO ($)" value={form.costo} onChange={v=>setForm({...form,costo:v})} type="number" placeholder="0"/>
          <Inp label="PRECIO DE VENTA ($)" value={form.precioVenta} onChange={v=>setForm({...form,precioVenta:v})} type="number" placeholder="0"/>
          <Btn onClick={agregar}>AGREGAR AL STOCK</Btn>
        </Modal>
      )}
    </div>
  );
}

// ─── VENTAS ───
function Ventas({ ventas, setVentas, stock, setStock }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ producto:"", cantidad:"1", precioUnitario:"", canal:CANALES[0], pago:PAGOS[0], nota:"" });

  const registrar = async () => {
    if(!form.producto||!form.precioUnitario) return;
    const total = Number(form.cantidad)*Number(form.precioUnitario);
    const nueva = {...form, total, fecha:nowISO(), id:Date.now()};
    const nuevas = [nueva,...ventas];
    setVentas(nuevas); await saveFB("ventas", nuevas);
    const prod = stock.find(p=>`${p.nombre} T.${p.talle}`===form.producto||p.nombre===form.producto);
    if(prod) { const ns=stock.map(p=>p.id===prod.id?{...p,cantidad:Math.max(0,Number(p.cantidad)-Number(form.cantidad))}:p); setStock(ns); await saveFB("stock",ns); }
    setModal(false); setForm({ producto:"", cantidad:"1", precioUnitario:"", canal:CANALES[0], pago:PAGOS[0], nota:"" });
  };

  const eliminar = async id => { const n=ventas.filter(v=>v.id!==id); setVentas(n); await saveFB("ventas",n); };

  return (
    <div style={{ padding:"20px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <SectionTitle>VENTAS</SectionTitle>
        <Btn onClick={()=>setModal(true)} bg={COLORS.green} tc="#000" full={false} small>+ VENTA</Btn>
      </div>
      {ventas.length===0 && <EmptyState text="Sin ventas registradas"/>}
      {ventas.map(v=>(
        <div key={v.id} style={{ background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div style={{ flex:1 }}>
              <div style={{ color:COLORS.white, fontSize:13, fontWeight:600 }}>{v.producto}</div>
              <div style={{ color:COLORS.gray, fontSize:11, marginTop:2 }}>{fmtDate(v.fecha)} · {v.cantidad} ud. · {v.canal}</div>
              <div style={{ display:"flex", gap:6, marginTop:4 }}>
                <span style={{ background:v.pago==="Efectivo"?"#22C55E22":"#4A9EFF22", color:v.pago==="Efectivo"?"#22C55E":COLORS.blue, fontSize:10, fontFamily:"'Bebas Neue',sans-serif", padding:"2px 7px", borderRadius:10 }}>{v.pago}</span>
                {v.nota && <span style={{ color:COLORS.grayLight, fontSize:11, fontStyle:"italic" }}>{v.nota}</span>}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:COLORS.green, fontFamily:"'Bebas Neue',sans-serif", fontSize:18 }}>{fmt(v.total)}</span>
              <button onClick={()=>eliminar(v.id)} style={{ background:"none",border:"none",cursor:"pointer",padding:4 }}><I n="trash" s={13} c={COLORS.gray}/></button>
            </div>
          </div>
        </div>
      ))}
      {modal && (
        <Modal title="REGISTRAR VENTA" onClose={()=>setModal(false)}>
          <Inp label="PRODUCTO" value={form.producto} onChange={v=>setForm({...form,producto:v})} placeholder="Nombre del producto"/>
          {stock.filter(p=>Number(p.cantidad)>0).length>0 && (
            <div style={{ marginBottom:12 }}>
              <Label>O ELEGÍ DEL STOCK:</Label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {stock.filter(p=>Number(p.cantidad)>0).map(p=>(
                  <button key={p.id} onClick={()=>setForm({...form,producto:`${p.nombre} T.${p.talle}`,precioUnitario:p.precioVenta})}
                    style={{ background:form.producto===`${p.nombre} T.${p.talle}`?COLORS.gold:COLORS.surface, color:form.producto===`${p.nombre} T.${p.talle}`?"#000":COLORS.white,
                      border:`1px solid ${COLORS.border}`,borderRadius:6,padding:"4px 10px",fontSize:10,cursor:"pointer" }}>
                    {p.nombre} T.{p.talle} ({p.cantidad})
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ flex:1 }}><Inp label="CANTIDAD" value={form.cantidad} onChange={v=>setForm({...form,cantidad:v})} type="number" placeholder="1"/></div>
            <div style={{ flex:1 }}><Inp label="PRECIO UNIT. ($)" value={form.precioUnitario} onChange={v=>setForm({...form,precioUnitario:v})} type="number" placeholder="0"/></div>
          </div>
          <Sel label="CANAL DE VENTA" value={form.canal} onChange={v=>setForm({...form,canal:v})} opts={CANALES}/>
          <Sel label="FORMA DE PAGO" value={form.pago} onChange={v=>setForm({...form,pago:v})} opts={PAGOS}/>
          <Inp label="NOTA (opcional)" value={form.nota} onChange={v=>setForm({...form,nota:v})} placeholder="Ej: descuento, cliente habitual..."/>
          {form.precioUnitario && (
            <div style={{ background:COLORS.surface, borderRadius:8, padding:"10px 14px", marginBottom:14 }}>
              <Label>TOTAL</Label>
              <div style={{ color:COLORS.green, fontFamily:"'Bebas Neue',sans-serif", fontSize:22 }}>{fmt(Number(form.cantidad||1)*Number(form.precioUnitario))}</div>
            </div>
          )}
          <Btn onClick={registrar} bg={COLORS.green} tc="#000">REGISTRAR VENTA</Btn>
        </Modal>
      )}
    </div>
  );
}

// ─── COMPRAS ───
function Compras({ compras, setCompras, stock, setStock }) {
  const [modal, setModal] = useState(false);
  const [prov, setProv] = useState("Fábrica Buenos Aires");
  const [fecha, setFecha] = useState(todayStr());
  const [nota, setNota] = useState("");
  const [items, setItems] = useState([{ nombre:"", categoria:"Shorts", categoriaOtros:"", talle:"M", cantidad:"", costo:"" }]);

  const addItem = () => setItems([...items, { nombre:"", categoria:"Shorts", categoriaOtros:"", talle:"M", cantidad:"", costo:"" }]);
  const removeItem = i => setItems(items.filter((_,idx)=>idx!==i));
  const updItem = (i,k,v) => setItems(items.map((it,idx)=>idx===i?{...it,[k]:v}:it));
  const totalCompra = items.reduce((s,it)=>s+(Number(it.cantidad||0)*Number(it.costo||0)),0);

  const confirmar = async () => {
    if(!prov||items.some(it=>!it.nombre||!it.cantidad)) return;
    let newStock = [...stock];
    items.forEach(it=>{
      const catFinal = it.categoria==="Otros"&&it.categoriaOtros ? it.categoriaOtros : it.categoria;
      const idx = newStock.findIndex(p=>p.nombre===it.nombre&&p.talle===it.talle);
      if(idx>=0) { newStock[idx]={...newStock[idx],cantidad:Number(newStock[idx].cantidad)+Number(it.cantidad)}; }
      else { newStock.push({ id:Date.now()+Math.random(), nombre:it.nombre, categoria:catFinal, talle:it.talle, cantidad:Number(it.cantidad), costo:it.costo, precioVenta:"" }); }
    });
    setStock(newStock); await saveFB("stock",newStock);
    const nueva = { id:Date.now(), proveedor:prov, fecha, nota, items:[...items], total:totalCompra };
    const nuevas = [nueva,...compras];
    setCompras(nuevas); await saveFB("compras",nuevas);
    setModal(false); setProv("Fábrica Buenos Aires"); setFecha(todayStr()); setNota("");
    setItems([{ nombre:"", categoria:"Shorts", categoriaOtros:"", talle:"M", cantidad:"", costo:"" }]);
  };

  const eliminar = async id => { const n=compras.filter(c=>c.id!==id); setCompras(n); await saveFB("compras",n); };

  return (
    <div style={{ padding:"20px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <SectionTitle>COMPRAS</SectionTitle>
        <Btn onClick={()=>setModal(true)} full={false} small>+ NUEVA</Btn>
      </div>
      {compras.length===0 && <EmptyState text="Sin compras registradas"/>}
      {compras.map(c=>(
        <Card key={c.id} gold style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ color:COLORS.white, fontSize:13, fontWeight:600 }}>{c.proveedor}</div>
              <div style={{ color:COLORS.gray, fontSize:11 }}>{fmtDate(c.fecha)}</div>
              {c.nota && <div style={{ color:COLORS.grayLight, fontSize:11, fontStyle:"italic" }}>{c.nota}</div>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:COLORS.gold, fontFamily:"'Bebas Neue',sans-serif", fontSize:18 }}>{fmt(c.total)}</span>
              <button onClick={()=>eliminar(c.id)} style={{ background:"none",border:"none",cursor:"pointer",padding:4 }}><I n="trash" s={13} c={COLORS.gray}/></button>
            </div>
          </div>
          {c.items&&c.items.length>0 && (
            <div style={{ marginTop:8, paddingTop:8, borderTop:`1px solid ${COLORS.border}` }}>
              {c.items.map((it,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ color:COLORS.grayLight, fontSize:11 }}>{it.nombre} T.{it.talle} × {it.cantidad}</span>
                  <span style={{ color:COLORS.gray, fontSize:11 }}>{fmt(Number(it.cantidad)*Number(it.costo))}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
      {modal && (
        <Modal title="NUEVA COMPRA A FÁBRICA" onClose={()=>setModal(false)}>
          <Inp label="PROVEEDOR" value={prov} onChange={setProv}/>
          <Inp label="FECHA" value={fecha} onChange={setFecha} type="date"/>
          <Inp label="NOTA (opcional)" value={nota} onChange={setNota} placeholder="Ej: incluye envío, seña..."/>
          <div style={{ borderTop:`1px solid ${COLORS.border}`, margin:"12px 0 10px" }}/>
          <Label>PRODUCTOS COMPRADOS</Label>
          {items.map((it,i)=>(
            <div key={i} style={{ background:COLORS.surface, borderRadius:10, padding:12, marginBottom:10, position:"relative" }}>
              {items.length>1 && <button onClick={()=>removeItem(i)} style={{ position:"absolute",top:8,right:8,background:"none",border:"none",cursor:"pointer" }}><I n="x" s={13} c={COLORS.gray}/></button>}
              <Inp label="NOMBRE DEL PRODUCTO" value={it.nombre} onChange={v=>updItem(i,"nombre",v)} placeholder="Ej: Short AFA Negro"/>
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ flex:1 }}><Sel label="CATEGORÍA" value={it.categoria} onChange={v=>updItem(i,"categoria",v)} opts={CATEGORIAS_STOCK}/></div>
                <div style={{ flex:1 }}><Sel label="TALLE" value={it.talle} onChange={v=>updItem(i,"talle",v)} opts={TALLES}/></div>
              </div>
              {it.categoria==="Otros" && <Inp label="ESPECIFICÁ LA CATEGORÍA" value={it.categoriaOtros||""} onChange={v=>updItem(i,"categoriaOtros",v)} placeholder="Ej: Gorras..."/>}
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ flex:1 }}><Inp label="CANTIDAD" value={it.cantidad} onChange={v=>updItem(i,"cantidad",v)} type="number" placeholder="0"/></div>
                <div style={{ flex:1 }}><Inp label="COSTO UNIT. ($)" value={it.costo} onChange={v=>updItem(i,"costo",v)} type="number" placeholder="0"/></div>
              </div>
            </div>
          ))}
          <button onClick={addItem} style={{ background:"none",border:`1px dashed ${COLORS.border}`,borderRadius:8,padding:8,width:"100%",color:COLORS.gold,fontSize:12,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,cursor:"pointer",marginBottom:14 }}>+ AGREGAR OTRO PRODUCTO</button>
          <div style={{ background:COLORS.surface, borderRadius:8, padding:"10px 14px", marginBottom:14 }}>
            <Label>TOTAL DE LA COMPRA</Label>
            <div style={{ color:COLORS.gold, fontFamily:"'Bebas Neue',sans-serif", fontSize:22 }}>{fmt(totalCompra)}</div>
          </div>
          <Btn onClick={confirmar}>CONFIRMAR COMPRA</Btn>
        </Modal>
      )}
    </div>
  );
}

// ─── GASTOS ───
function Gastos({ gastos, setGastos }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ descripcion:"", monto:"", categoria:CAT_GASTOS[0], fecha:todayStr() });

  const agregar = async () => {
    if(!form.descripcion||!form.monto) return;
    const nuevo = [{ ...form, id:Date.now() }, ...gastos];
    setGastos(nuevo); await saveFB("gastos",nuevo);
    setModal(false); setForm({ descripcion:"", monto:"", categoria:CAT_GASTOS[0], fecha:todayStr() });
  };
  const eliminar = async id => { const n=gastos.filter(g=>g.id!==id); setGastos(n); await saveFB("gastos",n); };
  const totalMes = gastos.filter(g=>{ const d=new Date(g.fecha),n=new Date(); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); }).reduce((s,g)=>s+Number(g.monto),0);

  return (
    <div style={{ padding:"20px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <SectionTitle>GASTOS</SectionTitle>
        <Btn onClick={()=>setModal(true)} bg={COLORS.red} tc={COLORS.white} full={false} small>+ GASTO</Btn>
      </div>
      <div style={{ color:COLORS.red, fontSize:12, marginBottom:14 }}>Este mes: {fmt(totalMes)}</div>
      {gastos.length===0 && <EmptyState text="Sin gastos registrados"/>}
      {gastos.map(g=>(
        <div key={g.id} style={{ background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div>
              <div style={{ color:COLORS.white, fontSize:13, fontWeight:600 }}>{g.descripcion}</div>
              <div style={{ color:COLORS.gray, fontSize:11, marginTop:2 }}>{fmtDate(g.fecha)} · {g.categoria}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:COLORS.red, fontFamily:"'Bebas Neue',sans-serif", fontSize:18 }}>{fmt(g.monto)}</span>
              <button onClick={()=>eliminar(g.id)} style={{ background:"none",border:"none",cursor:"pointer",padding:4 }}><I n="trash" s={13} c={COLORS.gray}/></button>
            </div>
          </div>
        </div>
      ))}
      {modal && (
        <Modal title="NUEVO GASTO" onClose={()=>setModal(false)}>
          <Inp label="DESCRIPCIÓN" value={form.descripcion} onChange={v=>setForm({...form,descripcion:v})} placeholder="Ej: Bolsas, flete, publicidad..."/>
          <Inp label="MONTO ($)" value={form.monto} onChange={v=>setForm({...form,monto:v})} type="number" placeholder="0"/>
          <Sel label="CATEGORÍA" value={form.categoria} onChange={v=>setForm({...form,categoria:v})} opts={CAT_GASTOS}/>
          <Inp label="FECHA" value={form.fecha} onChange={v=>setForm({...form,fecha:v})} type="date"/>
          <Btn onClick={agregar} bg={COLORS.red} tc={COLORS.white}>REGISTRAR GASTO</Btn>
        </Modal>
      )}
    </div>
  );
}

// ─── PEDIDOS ───
function Pedidos({ pedidos, setPedidos, ventas, setVentas }) {
  const [modal, setModal] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [form, setForm] = useState({ cliente:"", descripcion:"", total:"", sena:"", pago:PAGOS[0], fechaSeña:todayStr() });
  const colorEstado = e => ({ "Pendiente":COLORS.gray,"En producción":COLORS.blue,"Listo para entregar":COLORS.gold,"Entregado":COLORS.green }[e]||COLORS.gray);

  const crear = async () => {
    if(!form.cliente||!form.total||!form.sena) return;
    const nuevo = {...form, id:Date.now(), estado:"Pendiente", fechaEntrega:null};
    const nuevos = [nuevo,...pedidos];
    setPedidos(nuevos); await saveFB("pedidos",nuevos);
    setModal(false); setForm({ cliente:"", descripcion:"", total:"", sena:"", pago:PAGOS[0], fechaSeña:todayStr() });
  };

  const avanzar = async id => {
    const p=pedidos.find(x=>x.id===id);
    const idx=ESTADOS_PEDIDO.indexOf(p.estado);
    if(idx>=ESTADOS_PEDIDO.length-1) return;
    const newEstado=ESTADOS_PEDIDO[idx+1];
    const extra=newEstado==="Entregado"?{fechaEntrega:nowISO()}:{};
    const nuevos=pedidos.map(x=>x.id===id?{...x,estado:newEstado,...extra}:x);
    setPedidos(nuevos); await saveFB("pedidos",nuevos);
    if(newEstado==="Entregado") {
      const saldo=Number(p.total)-Number(p.sena);
      if(saldo>0) {
        const venta={ id:Date.now(), producto:`Pedido: ${p.descripcion||p.cliente}`, cantidad:1, precioUnitario:saldo, total:saldo, canal:"Pedido personalizado", pago:p.pago, nota:`Cliente: ${p.cliente}`, fecha:nowISO() };
        const nv=[venta,...ventas]; setVentas(nv); await saveFB("ventas",nv);
      }
    }
    setDetalle(null);
  };

  const eliminar = async id => { const n=pedidos.filter(p=>p.id!==id); setPedidos(n); await saveFB("pedidos",n); setDetalle(null); };
  const pendientes=pedidos.filter(p=>p.estado!=="Entregado");
  const entregados=pedidos.filter(p=>p.estado==="Entregado");

  return (
    <div style={{ padding:"20px 16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <SectionTitle>PEDIDOS</SectionTitle>
        <Btn onClick={()=>setModal(true)} bg={COLORS.purple} tc={COLORS.white} full={false} small>+ PEDIDO</Btn>
      </div>
      {pendientes.length===0&&entregados.length===0 && <EmptyState text="Sin pedidos registrados"/>}
      {pendientes.length>0 && <>
        <SubTitle>ACTIVOS</SubTitle>
        {pendientes.map(p=>(
          <div key={p.id} onClick={()=>setDetalle(p)} style={{ background:COLORS.card,border:`1px solid ${COLORS.purple}44`,borderRadius:12,padding:"12px 14px",marginBottom:8,cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div>
                <div style={{ color:COLORS.white, fontSize:13, fontWeight:600 }}>{p.cliente}</div>
                <div style={{ color:COLORS.gray, fontSize:11, marginTop:2 }}>{p.descripcion}</div>
                <span style={{ background:colorEstado(p.estado)+"22", color:colorEstado(p.estado), fontSize:10, fontFamily:"'Bebas Neue',sans-serif", padding:"2px 8px", borderRadius:10, display:"inline-block", marginTop:4 }}>{p.estado}</span>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ color:COLORS.gold, fontFamily:"'Bebas Neue',sans-serif", fontSize:16 }}>{fmt(p.total)}</div>
                <div style={{ color:COLORS.gray, fontSize:10 }}>Seña: {fmt(p.sena)}</div>
                <div style={{ color:COLORS.green, fontSize:10 }}>Saldo: {fmt(Number(p.total)-Number(p.sena))}</div>
              </div>
            </div>
          </div>
        ))}
      </>}
      {entregados.length>0 && <>
        <SubTitle style={{ marginTop:16 }}>ENTREGADOS</SubTitle>
        {entregados.map(p=>(
          <div key={p.id} onClick={()=>setDetalle(p)} style={{ background:COLORS.card,border:`1px solid ${COLORS.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8,cursor:"pointer",opacity:0.65 }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <div><div style={{ color:COLORS.white, fontSize:13, fontWeight:600 }}>{p.cliente}</div><div style={{ color:COLORS.gray, fontSize:11 }}>{p.descripcion}</div></div>
              <div style={{ color:COLORS.gold, fontFamily:"'Bebas Neue',sans-serif", fontSize:16 }}>{fmt(p.total)}</div>
            </div>
          </div>
        ))}
      </>}

      {modal && (
        <Modal title="NUEVO PEDIDO" onClose={()=>setModal(false)}>
          <Inp label="NOMBRE DEL CLIENTE" value={form.cliente} onChange={v=>setForm({...form,cliente:v})} placeholder="Ej: Equipo Los Pibes"/>
          <Inp label="DESCRIPCIÓN DEL PEDIDO" value={form.descripcion} onChange={v=>setForm({...form,descripcion:v})} placeholder="Ej: 15 camisetas azules con número"/>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ flex:1 }}><Inp label="TOTAL ACORDADO ($)" value={form.total} onChange={v=>setForm({...form,total:v})} type="number" placeholder="0"/></div>
            <div style={{ flex:1 }}><Inp label="SEÑA ($)" value={form.sena} onChange={v=>setForm({...form,sena:v})} type="number" placeholder="0"/></div>
          </div>
          <Sel label="PAGO DE SEÑA" value={form.pago} onChange={v=>setForm({...form,pago:v})} opts={PAGOS}/>
          <Inp label="FECHA DE SEÑA" value={form.fechaSeña} onChange={v=>setForm({...form,fechaSeña:v})} type="date"/>
          {form.total&&form.sena && (
            <div style={{ background:COLORS.surface, borderRadius:8, padding:"10px 14px", marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div><Label>SEÑA</Label><div style={{ color:COLORS.gold, fontFamily:"'Bebas Neue',sans-serif", fontSize:18 }}>{fmt(form.sena)}</div></div>
                <div><Label>SALDO A COBRAR</Label><div style={{ color:COLORS.green, fontFamily:"'Bebas Neue',sans-serif", fontSize:18 }}>{fmt(Number(form.total)-Number(form.sena))}</div></div>
              </div>
            </div>
          )}
          <Btn onClick={crear} bg={COLORS.purple} tc={COLORS.white}>CREAR PEDIDO</Btn>
        </Modal>
      )}

      {detalle && (
        <Modal title={detalle.cliente} onClose={()=>setDetalle(null)}>
          <div style={{ marginBottom:12 }}><Label>DESCRIPCIÓN</Label><div style={{ color:COLORS.white, fontSize:13 }}>{detalle.descripcion||"—"}</div></div>
          <div style={{ display:"flex", gap:12, marginBottom:16 }}>
            <div><Label>TOTAL</Label><div style={{ color:COLORS.gold, fontFamily:"'Bebas Neue',sans-serif", fontSize:20 }}>{fmt(detalle.total)}</div></div>
            <div><Label>SEÑA</Label><div style={{ color:COLORS.grayLight, fontFamily:"'Bebas Neue',sans-serif", fontSize:20 }}>{fmt(detalle.sena)}</div></div>
            <div><Label>SALDO</Label><div style={{ color:COLORS.green, fontFamily:"'Bebas Neue',sans-serif", fontSize:20 }}>{fmt(Number(detalle.total)-Number(detalle.sena))}</div></div>
          </div>
          <Label>ESTADO DEL PEDIDO</Label>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
            {ESTADOS_PEDIDO.map((e,i)=>{
              const curr=ESTADOS_PEDIDO.indexOf(detalle.estado), done=i<=curr;
              return (
                <div key={e} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:20, height:20, borderRadius:"50%", background:done?colorEstado(detalle.estado):"transparent", border:`2px solid ${done?colorEstado(detalle.estado):COLORS.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {done && <I n="check" s={11} c="#000"/>}
                  </div>
                  <span style={{ color:done?COLORS.white:COLORS.gray, fontSize:13 }}>{e}</span>
                </div>
              );
            })}
          </div>
          {detalle.estado!=="Entregado" && <div style={{ marginBottom:10 }}><Btn onClick={()=>avanzar(detalle.id)} bg={COLORS.gold} tc="#000">AVANZAR → {ESTADOS_PEDIDO[ESTADOS_PEDIDO.indexOf(detalle.estado)+1]}</Btn></div>}
          <Btn onClick={()=>eliminar(detalle.id)} bg={COLORS.red} tc={COLORS.white}>ELIMINAR PEDIDO</Btn>
        </Modal>
      )}
    </div>
  );
}

// ─── APP ROOT ───
export default function App() {
  const [tab, setTab] = useState("inicio");
  const [stock, setStock] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadFB("stock"),loadFB("ventas"),loadFB("gastos"),loadFB("compras"),loadFB("pedidos")])
      .then(([s,v,g,c,p])=>{ setStock(s);setVentas(v);setGastos(g);setCompras(c);setPedidos(p);setLoading(false); });
  }, []);

  const tabs = [
    { id:"inicio",  label:"INICIO",  icon:"home"  },
    { id:"ventas",  label:"VENTAS",  icon:"trend" },
    { id:"stock",   label:"STOCK",   icon:"box"   },
    { id:"compras", label:"COMPRAS", icon:"cart"  },
    { id:"gastos",  label:"GASTOS",  icon:"minus" },
    { id:"pedidos", label:"PEDIDOS", icon:"clip"  },
  ];

  if(loading) return (
    <div style={{ background:COLORS.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:COLORS.gold, fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:2 }}>CARGANDO...</div>
    </div>
  );

  return (
    <div style={{ background:COLORS.bg, minHeight:"100vh", maxWidth:480, margin:"0 auto" }}>
      <div style={{ paddingBottom:72 }}>
        {tab==="inicio"  && <Inicio  stock={stock} ventas={ventas} gastos={gastos} compras={compras} pedidos={pedidos}/>}
        {tab==="ventas"  && <Ventas  ventas={ventas} setVentas={setVentas} stock={stock} setStock={setStock}/>}
        {tab==="stock"   && <Stock   stock={stock} setStock={setStock}/>}
        {tab==="compras" && <Compras compras={compras} setCompras={setCompras} stock={stock} setStock={setStock}/>}
        {tab==="gastos"  && <Gastos  gastos={gastos} setGastos={setGastos}/>}
        {tab==="pedidos" && <Pedidos pedidos={pedidos} setPedidos={setPedidos} ventas={ventas} setVentas={setVentas}/>}
      </div>
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:COLORS.surface, borderTop:`1px solid ${COLORS.border}`, display:"flex", zIndex:50 }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", padding:"10px 0 8px", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
            <I n={t.icon} s={17} c={tab===t.id?COLORS.gold:COLORS.gray}/>
            <span style={{ fontSize:7, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:0.5, color:tab===t.id?COLORS.gold:COLORS.gray }}>{t.label}</span>
            {tab===t.id && <div style={{ width:14, height:2, background:COLORS.gold, borderRadius:1 }}/>}
          </button>
        ))}
      </div>
    </div>
  );
}

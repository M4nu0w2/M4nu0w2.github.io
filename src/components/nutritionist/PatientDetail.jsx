import { useState } from 'react';
import { useNutriApi, useLoader } from './api.mjs';
import { CopyInvite } from './CopyInvite.jsx';
import { PlanUpload } from './PlanUpload.jsx';

const itemKey = (item, mealIndex, itemIndex) => item.id || `${mealIndex}_${itemIndex}`;

function PatientDetail({ patient, csrf, refreshList }) {
  const api = useNutriApi(csrf);
  const [detail, error, load] = useLoader(() => api(`/api/nutritionist/patients/${patient.id}`), [patient.id, csrf], 'Dettaglio non disponibile. Riprova.');
  const [day, setDay] = useState(null);
  if (detail) {
    const wanted = day && detail.plan?.data.days[day] ? day : detail.plan?.data.days[detail.day] ? detail.day : Object.keys(detail.plan?.data.days || {})[0] || null;
    if (wanted !== day) setDay(wanted);
  }
  if (error) return <div className="nutri-detail"><p className="notice error" role="alert">{error}</p><button className="btn secondary small" onClick={load}>Riprova</button></div>;
  if (!detail) return <div className="nutri-detail"><p role="status">Caricamento…</p></div>;
  const { plan, tracking } = detail;
  const checked = day && tracking[day]?.checked?.value || {};
  const water = day && tracking[day]?.water?.value || 0;
  return <div className="nutri-detail">
    {detail.patient.inviteUrl && <CopyInvite url={detail.patient.inviteUrl} />}
    {plan ? <>
      <p className="muted">Piano: <strong>{plan.name}</strong> · assegnato il {new Date(plan.createdAt).toLocaleDateString('it-IT')}</p>
      {day && <>
        <div className="day-tabs" role="group" aria-label="Giorno">{Object.entries(plan.data.days).map(([key, value]) => <button key={key} className={`day-tab ${day === key ? 'active' : ''}`} aria-pressed={day === key} onClick={() => setDay(key)}>{(value.dayName || key).slice(0, 3)}</button>)}</div>
        <p className="muted">{day === detail.day ? 'Oggi' : plan.data.days[day].dayName || day} · Acqua: {water} bicchieri ({(water * .2).toLocaleString('it-IT')} L)</p>
        <div className="nutri-meals">{(plan.data.days[day].meals || []).map((meal, mi) => <section className="meal-card" key={meal.id || mi}>
          <div className="meal-heading"><h3>{meal.icon || '◷'} {meal.name || meal.mealName || 'Pasto'}</h3><span className="badge">{meal.items.filter((item, ii) => checked[itemKey(item, mi, ii)]).length}/{meal.items.length}</span></div>
          {meal.items.map((item, ii) => { const key = itemKey(item, mi, ii); const eaten = !!checked[key]; return <div className={`food-row ${eaten ? 'checked' : ''}`} key={key}><span className={`nutri-tick ${eaten ? 'done' : ''}`} aria-hidden="true">{eaten ? '✓' : '○'}</span><div className="food-content"><div className="food-name">{item.isSubItem && '↳ '}{item.name}</div></div><span className="food-qty">{item.qty}</span><span className="sr-only">{eaten ? 'consumato' : 'non consumato'}</span></div>; })}
        </section>)}</div>
      </>}
    </> : <p className="muted">Nessun piano assegnato.</p>}
    <PlanUpload patient={{ ...detail.patient, planName: plan?.name }} csrf={csrf} onUploaded={() => { load(); refreshList(); }} />
  </div>;
}

export { PatientDetail, itemKey };

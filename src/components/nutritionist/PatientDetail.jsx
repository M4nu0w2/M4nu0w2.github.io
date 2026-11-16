import { useState } from 'react';
import { useNutriApi, useLoader } from './api.mjs';
import { CopyInvite } from './CopyInvite.jsx';
import { PlanUpload } from './PlanUpload.jsx';
import { isCountedItem, displayQty, dayOil, formatOil } from '../../lib/tracking.mjs';
import { dayTabKeyDown } from '../../lib/tabs.mjs';
import { getFoodChoices } from '../../lib/dietEngine.mjs';
// Units are not part of the patient's row yet (settings stay client-side); the nutritionist
// always sees the PDF's own units, same default a patient who never opened Settaggi would see.
const UNITS = 'pdf';

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
  const oilRecorded = day && tracking[day]?.oil?.value || {};
  const oil = day ? dayOil({ data: plan?.data, checked: { [day]: checked }, oil: { [day]: oilRecorded } }, day) : null;
  const warnings = plan?.data?.metadata?.quality?.warnings || [];
  return <div className="nutri-detail">
    {detail.patient.inviteUrl && <CopyInvite url={detail.patient.inviteUrl} />}
    {plan ? <>
      <p className="muted">Piano: <strong>{plan.name}</strong> · assegnato il {new Date(plan.createdAt).toLocaleDateString('it-IT')}</p>
      {warnings.length > 0 && <div className="notice warning">{warnings.map(text => <p key={text}>{text}</p>)}</div>}
      {day && <>
        <div className="day-tabs" role="tablist" aria-label="Giorno" onKeyDown={event => dayTabKeyDown(event, Object.keys(plan.data.days), day, setDay)}>{Object.entries(plan.data.days).map(([key, value]) => <button key={key} role="tab" data-day-tab={key} className={`day-tab ${day === key ? 'active' : ''}`} aria-selected={day === key} tabIndex={day === key ? 0 : -1} aria-label={value.dayName || key} onClick={() => setDay(key)}>{(value.dayName || key).slice(0, 3)}</button>)}</div>
        <p className="muted">{day === detail.day ? 'Oggi' : plan.data.days[day].dayName || day} · Acqua: {water} bicchieri ({(water * .2).toLocaleString('it-IT')} L)</p>
        <div className="nutri-meals">{(plan.data.days[day].meals || []).map((meal, mi) => <section className="meal-card" key={meal.id || mi}>
          <div className="meal-heading"><h3>{meal.icon || '◷'} {meal.name || meal.mealName || 'Pasto'}</h3><span className="badge">{meal.items.filter((item, ii) => isCountedItem(item, ii, meal.items) && checked[itemKey(item, mi, ii)]).length}/{meal.items.filter((item, ii) => isCountedItem(item, ii, meal.items)).length}</span></div>
          {meal.items.map((item, ii) => {
            const key = itemKey(item, mi, ii); const eaten = !!checked[key];
            const shown = displayQty(item, UNITS), choices = getFoodChoices(item), oilRow = oil?.rows[key];
            return <div className={`food-row ${eaten ? 'checked' : ''}`} key={key}>
              <span className={`nutri-tick ${eaten ? 'done' : ''}`} aria-hidden="true">{eaten ? '✓' : '○'}</span>
              <div className="food-content">
                <div className="food-name">{item.isSubItem && '↳ '}{item.name}</div>
                {shown.note && <p className="muted">{shown.note}</p>}
                {choices.length > 1 && <p className="alternatives">oppure {choices.slice(1).map(choice => { const altQty = displayQty(choice, UNITS).qty; return `${choice.name}${altQty ? ` · ${altQty}` : ''}`; }).join(' oppure ')}</p>}
                {oilRow?.counted && <p className="muted">Olio usato: {formatOil(oilRow.grams, UNITS)}</p>}
              </div>
              <span className="food-qty">{shown.qty}</span>
              <span className="sr-only">{eaten ? 'consumato' : 'non consumato'}</span>
            </div>;
          })}
        </section>)}</div>
      </>}
    </> : <p className="muted">Nessun piano assegnato.</p>}
    <PlanUpload patient={{ ...detail.patient, planName: plan?.name }} csrf={csrf} onUploaded={() => { load(); refreshList(); }} />
  </div>;
}

export { PatientDetail, itemKey };

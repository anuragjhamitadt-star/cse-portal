import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./firebase";
import {
  doc, collection, onSnapshot,
  setDoc, updateDoc, deleteDoc,
  addDoc, getDocs, writeBatch
} from "firebase/firestore";

// ════════════════════════════════════════════════════════
//  CONSTANTS & INITIAL DATA
// ════════════════════════════════════════════════════════
const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;

// Default admin credentials — stored in state so they can be changed
const DEFAULT_CREDS = {
  owner: { username: "Admin_YourCollege", password: "YourCollege_2026", nickname: "Owner" },
  members: [
    { id: "m1", username: "Your_Member_1", password: "Default1@25-26", defaultPassword: "Default1@25-26", nickname: "", mustChangePassword: true },
    { id: "m2", username: "Your_Member_2", password: "Default2@25-26", defaultPassword: "Default2@25-26", nickname: "", mustChangePassword: true },
    { id: "m3", username: "Your_Member_3", password: "Default3@25-26", defaultPassword: "Default3@25-26", nickname: "", mustChangePassword: true },
  ],
};

const STREAMS_34 = [
  "Cybersecurity and Forensics","CSE Core","Cloud Computing",
  "Big Data","Blockchain","AI Edge Computing",
  "AI Analytics","AI IoT","AI ML"
];

const INITIAL_FACULTY = [
  { id: 1, name: "Prof. Sagar Godse", dept: "MFC", cabin: "S116 (South, 1st Floor, Room 16)" },
  { id: 2, name: "Prof. Hemant Tajanpure", dept: "MFC", cabin: "S002 (South, Ground Floor, Room 02)" },
  { id: 3, name: "Prof. Shahin Shaikh", dept: "MFC", cabin: "S002 (South, Ground Floor, Room 02)" },
  { id: 4, name: "Dr. Aishwaraya Goyal", dept: "MFC", cabin: "Pending" },
  { id: 5, name: "Prof. Gitanjali More", dept: "MFC", cabin: "S215 (South, 2nd Floor, Room 15)" },
  { id: 6, name: "Prof. Irshad Jamadar", dept: "MFC", cabin: "S002 (South, Ground Floor, Room 02)" },
  { id: 7, name: "Prof. Pramod Ghatage", dept: "MFC", cabin: "S002 (South, Ground Floor, Room 02)" },
  { id: 8, name: "Dr. Ruma Saha", dept: "MFC", cabin: "S215 (South, 2nd Floor, Room 15)" },
  { id: 9, name: "Dr. Krishna Kumar", dept: "MFC", cabin: "S215 (South, 2nd Floor, Room 15)" },
  { id: 10, name: "Prof. Rohini Ingale", dept: "MFC", cabin: "S116 (South, 1st Floor, Room 16)" },
  { id: 11, name: "Prof. Shashikant Waghule", dept: "MFC", cabin: "S116 (South, 1st Floor, Room 16)" },
  { id: 12, name: "Prof. Pramod Yelam", dept: "MFC", cabin: "S215 (South, 2nd Floor, Room 15)" },
  { id: 13, name: "Dr. Pallab Maiti", dept: "MFC", cabin: "Pending" },
  { id: 14, name: "Prof. Sanjay Ghodechor", dept: "MFC", cabin: "S116 (South, 1st Floor, Room 16)" },
  { id: 15, name: "Dr. Mahesh Kumar Jayaswal", dept: "MFC", cabin: "Pending" },
  { id: 16, name: "Dr. S. D. Bhourgunde", dept: "MFC", cabin: "Pending" },
  { id: 17, name: "Ms. Varsha Yadav", dept: "MFC", cabin: "Pending" },
  { id: 18, name: "Prof. Umesh Nanavare", dept: "Computational Thinking, IDS", cabin: "S001 (South, Ground Floor, Room 01)" },
  { id: 19, name: "Prof. Aparna Torade", dept: "C Programming, IDS, C++ Programming", cabin: "J905 (Junction, 9th Floor, Table 05)" },
  { id: 20, name: "Prof. Vikas More", dept: "Computational Thinking, IDS, Python-II Programming", cabin: "9th Floor South – Desk D" },
  { id: 21, name: "Prof. Bhausaheb Salve", dept: "Computational Thinking, C Programming, Python-II Programming", cabin: "S309 (South, 3rd Floor, Room 09)" },
  { id: 22, name: "Prof. Rinku Badgujar", dept: "Computational Thinking, IDS", cabin: "S511 (South, 5th Floor, Room 11)" },
  { id: 23, name: "Prof. Pratiksha Dhande", dept: "Computational Thinking, Python Programming, IDS, Python-II Programming", cabin: "J922 (Junction, 9th Floor, Table 22)" },
  { id: 24, name: "Prof. Priya Khune", dept: "Computational Thinking, C Programming, IDS, C++ Programming", cabin: "S211 (South, 2nd Floor, Room 11)" },
  { id: 25, name: "Prof. Renuka Arbat", dept: "Computational Thinking, C Programming, Python Programming, IDS, Python-II Programming", cabin: "J916 (Junction, 9th Floor, Table 16)" },
  { id: 26, name: "Prof. Rutuja Patil", dept: "Computational Thinking, IDS, C++ Programming", cabin: "Pending" },
  { id: 27, name: "Prof. Pooja Pawale", dept: "Computational Thinking, Python Programming, IDS, Python-II Programming", cabin: "J915 (Junction, 9th Floor, Table 15)" },
  { id: 28, name: "Prof. Arsalan Khan", dept: "Computational Thinking, Python Programming, C Programming", cabin: "Pending" },
  { id: 29, name: "Prof. Pragati Dhore", dept: "Computational Thinking, Python Programming", cabin: "Pending" },
  { id: 30, name: "Prof. Neha Chaube", dept: "Computational Thinking", cabin: "Pending" },
  { id: 31, name: "Prof. Sonal Chanderi", dept: "Python-II Programming", cabin: "Pending" },
  { id: 32, name: "Prof. Ashwini Shahapurkar", dept: "C++ Programming", cabin: "Pending" },
  { id: 33, name: "Prof. Bajirao Salunke", dept: "C++ Programming", cabin: "J931 (Junction, 9th Floor, Table 31)" },
  { id: 34, name: "Dr. Shalini Garg", dept: "Engineering Physics, Engineering Physics-II", cabin: "N003 (North, Ground Floor, Room 03)" },
  { id: 35, name: "Dr. Harshawardhan Bhatkar", dept: "Engineering Physics", cabin: "Pending" },
  { id: 36, name: "Dr. Bhavik Kodrani", dept: "Engineering Physics, Engineering Physics-II", cabin: "Pending" },
  { id: 37, name: "Dr. Sachin Potdar", dept: "Engineering Physics, Engineering Physics-II", cabin: "N014 (North, Ground Floor, Room 14)" },
  { id: 38, name: "Dr. Tushar Jagdale", dept: "Engineering Physics", cabin: "Pending" },
  { id: 39, name: "Dr. Amol Deore", dept: "Engineering Physics, Engineering Photonics", cabin: "N120 (North, 1st Floor, Room 20)" },
  { id: 40, name: "Dr. Poonam Shewale", dept: "Engineering Physics, Engineering Physics-II, Engineering Photonics", cabin: "Pending" },
  { id: 41, name: "Prof. Nitesh Yadav", dept: "Engineering Physics", cabin: "Pending" },
  { id: 42, name: "Dr. Vaishali Kamble", dept: "MCD", cabin: "Pending" },
  { id: 43, name: "Dr. Rajesh Jadhav", dept: "MCD", cabin: "Pending" },
  { id: 44, name: "Dr. Benazir Pirjade", dept: "MCD", cabin: "Pending" },
  { id: 45, name: "Dr. Manoj Patowary", dept: "MCD", cabin: "Pending" },
  { id: 46, name: "Prof. Laxmikant Jagtap", dept: "MCD", cabin: "N005 (North, Ground Floor, Room 05)" },
  { id: 47, name: "Dr. Sachin Musale", dept: "MCD", cabin: "Pending" },
  { id: 48, name: "Dr. Ramesh Mali", dept: "EEE", cabin: "Pending" },
  { id: 49, name: "Prof. Megha Wanghede", dept: "EEE", cabin: "Pending" },
  { id: 50, name: "Prof. Rajesh Halke", dept: "EEE, DELD", cabin: "9th Floor – Desk G" },
  { id: 51, name: "Dr. Pallavi Asthana", dept: "EEE", cabin: "S411 (South, 4th Floor, Room 11)" },
  { id: 52, name: "Dr. Tushar Mote", dept: "EEE, DELD", cabin: "Pending" },
  { id: 53, name: "Dr. Nitish Das", dept: "EEE, DELD", cabin: "Pending" },
  { id: 54, name: "Prof. Pratiksha Malvatkar", dept: "EEE, DELD", cabin: "S211 (South, 2nd Floor, Room 11)" },
  { id: 55, name: "Dr. Chandrashekhar Kamargaonkar", dept: "EEE", cabin: "Pending" },
  { id: 56, name: "Dr. Sachin Tiwari", dept: "EEE, IDS, Python Programming", cabin: "Pending" },
  { id: 57, name: "Prof. Viddulata Patil", dept: "EEE, DELD", cabin: "Pending" },
  { id: 58, name: "Prof. Mayuresh Gulame", dept: "EEE, DELD", cabin: "S001 (South, Ground Floor, Room 01)" },
  { id: 59, name: "Prof. Tanuja Zende", dept: "EEE, DELD", cabin: "Pending" },
  { id: 60, name: "Prof. Vishal Maloji Patil", dept: "DELD", cabin: "S513 (South, 5th Floor, Room 13)" },
  { id: 61, name: "Prof. Trupti Kudale", dept: "DELD", cabin: "S402 (South, 4th Floor, Room 02)" },
  { id: 62, name: "Dr. Sangita Patil", dept: "DELD", cabin: "S109 (South, 1st Floor, Room 09)" },
  { id: 63, name: "Prof. Shraddha Kashid / Katkar", dept: "DELD", cabin: "Pending" },
  { id: 64, name: "Dr. Madhukar Nimbalkar", dept: "DELD", cabin: "Pending" },
  { id: 65, name: "Prof. Kanchan Vaidya", dept: "English", cabin: "Pending" },
  { id: 66, name: "Dr. Balasaheb Wakade", dept: "English", cabin: "Pending" },
  { id: 67, name: "Dr. Pranav Mulavkar", dept: "English", cabin: "Pending" },
  { id: 68, name: "Dr. Swapnil Shirsath", dept: "English", cabin: "Pending" },
  { id: 69, name: "Prof. Aditi Rajput", dept: "English", cabin: "N115 (North, 1st Floor, Room 15)" },
  { id: 70, name: "Dr. Jayashri Nalkar", dept: "English", cabin: "Pending" },
  { id: 71, name: "Dr. Amol Agashe", dept: "English", cabin: "Pending" },
  { id: 72, name: "Prof. Sonakshi Pundir", dept: "Design Thinking", cabin: "S116 (South, 1st Floor, Room 16)" },
  { id: 73, name: "Prof. Deepak Shah", dept: "Design Thinking", cabin: "S014 (South, Ground Floor, Room 14)" },
  { id: 74, name: "Prof. Charanjeet Singh Barmi", dept: "Design Thinking", cabin: "S116 (South, 1st Floor, Room 16)" },
  { id: 75, name: "Prof. Manpreet Rajpal", dept: "Design Thinking", cabin: "S116 (South, 1st Floor, Room 16)" },
  { id: 76, name: "Prof. Akash Alegaonkar", dept: "Design Thinking", cabin: "S116 (South, 1st Floor, Room 16)" },
  { id: 77, name: "Prof. Toshit Harshwal", dept: "Design Thinking", cabin: "S014 (South, Ground Floor, Room 14)" },
  { id: 78, name: "Prof. Amruta Malvade", dept: "Indian Knowledge System (IKS)", cabin: "Pending" },
  { id: 79, name: "Prof. Sayali Kare", dept: "Indian Knowledge System (IKS)", cabin: "S002 (South, Ground Floor, Room 02)" },
  { id: 80, name: "Dr. Manish Walvekar", dept: "Indian Knowledge System (IKS)", cabin: "School of Vedic Sciences, MIT-ADT University, Ground Floor" },
  { id: 81, name: "SHD Team", dept: "Health Practices I & II", cabin: "Contact the Sports & Health Department (SHD)" },
  { id: 82, name: "CAPA Team", dept: "Cultural Arts & Performing Arts", cabin: "Contact the CAPA Department" },
  { id: 83, name: "CEW Team", dept: "Computer Engineering Workshop", cabin: "Contact the CEW Department" },
];

const INITIAL_POSTS = [
  { id: "p1", title: "TechFest 2025 Registration Open!", body: "Annual TechFest registrations are now open. Last date: 15th June.", date: Date.now() - 86400000, tag: "Event", pinned: true, likes: 12, dislikes: 1, hasTicket: false, ticketEventId: "", poll: null },
  { id: "p2", title: "Coding Club Weekly Meet", body: "Every Friday 5pm at Lab 3, Block B. Competitive Programming Bootcamp this week.", date: Date.now() - 2*86400000, tag: "Club", pinned: false, likes: 8, dislikes: 0, hasTicket: false, ticketEventId: "", poll: { question: "Which topic next week?", options: ["DP", "Graphs", "Strings", "Trees"], votes: [5,3,2,4] } },
];

function makeSlots(pdfs=[], links=[]) {
  return {
    pdfs: Array(10).fill(null).map((_,i) => pdfs[i]||{label:"",url:""}),
    links: Array(5).fill(null).map((_,i) => links[i]||{label:"",url:""}),
  };
}
function makeYearSections() {
  return { syllabus: makeSlots(), calendar: makeSlots(), pyq: makeSlots(), notes: makeSlots(), timetable: makeSlots(), examMid1: makeSlots(), examEnd1: makeSlots(), examMid2: makeSlots(), examEnd2: makeSlots() };
}
function make34Resources() { const out={}; STREAMS_34.forEach(s=>{out[s]=makeYearSections();}); return out; }
const INITIAL_RESOURCES = {
  1: { ...makeYearSections(), pyq: makeSlots([],[{label:"YourNotes – PYQ",url:"https://yournotes.odoo.com/home#notes"}]), notes: makeSlots([],[{label:"YourNotes",url:"https://yournotes.odoo.com/home#notes"}]) },
  2: makeYearSections(), 3: make34Resources(), 4: make34Resources(),
};

// ════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════
function fuzzyMatch(str, q) { str=str.toLowerCase(); q=q.toLowerCase(); let qi=0; for(let i=0;i<str.length&&qi<q.length;i++) if(str[i]===q[qi]) qi++; return qi===q.length; }
function getGradePoint(m) { if(m>=91)return 10;if(m>=81)return 9;if(m>=71)return 8;if(m>=61)return 7;if(m>=51)return 6;if(m>=46)return 5;if(m>=40)return 4;return 0; }
function fmtDate(ts) { return new Date(ts).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); }
function fmtDateTime(ts) { return new Date(ts).toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}); }
function genId() { return Math.random().toString(36).slice(2,10); }
function genTicketNo(eventName, idx) { return `TKT-${eventName.slice(0,3).toUpperCase().replace(/\s/g,"")}-${String(idx+1).padStart(4,"0")}-${Date.now().toString(36).slice(-4).toUpperCase()}`; }
function randomPassword() { const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#"; return Array.from({length:10},()=>chars[Math.floor(Math.random()*chars.length)]).join(""); }

// ════════════════════════════════════════════════════════
//  STYLE HELPERS
// ════════════════════════════════════════════════════════
const IS = { padding:"9px 13px", borderRadius:9, border:"1.5px solid var(--border)", background:"var(--bg)", color:"var(--text)", fontSize:"0.88rem", fontFamily:"var(--font-body)", outline:"none", boxSizing:"border-box", width:"100%" };
const BS = (bg="var(--accent)",extra={}) => ({ background:bg, color:"#fff", border:"none", borderRadius:10, padding:"9px 18px", cursor:"pointer", fontFamily:"var(--font-head)", fontWeight:700, fontSize:"0.85rem", transition:"opacity 0.15s", ...extra });

// ════════════════════════════════════════════════════════
//  TAG
// ════════════════════════════════════════════════════════
function Tag({text}) {
  const c={Event:"#f59e0b",Club:"#10b981",Notice:"#3b82f6",Admin:"#ef4444"};
  return <span style={{background:c[text]||"#6366f1",color:"#fff",fontSize:"0.65rem",fontWeight:800,padding:"3px 10px",borderRadius:20,letterSpacing:"0.06em",textTransform:"uppercase"}}>{text}</span>;
}

// ════════════════════════════════════════════════════════
//  RESOURCE VIEWER
// ════════════════════════════════════════════════════════
function ResourceViewer({section}) {
  const ap=section.pdfs.filter(p=>p.url.trim());
  const al=section.links.filter(l=>l.url.trim());
  if(!ap.length&&!al.length) return <p style={{opacity:0.4,fontSize:"0.85rem",padding:"10px 0"}}>No resources yet. Check back soon!</p>;
  const row=(item,i,isPdf)=>(
    <a key={i} href={item.url} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:isPdf?"rgba(99,102,241,0.08)":"rgba(16,185,129,0.08)",borderRadius:10,border:`1px solid ${isPdf?"rgba(99,102,241,0.2)":"rgba(16,185,129,0.2)"}`,textDecoration:"none",color:"var(--text)",marginBottom:6,transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.opacity="0.8"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
      <span>{isPdf?"📄":"🔗"}</span>
      <span style={{fontWeight:600,fontSize:"0.88rem"}}>{item.label||`${isPdf?"PDF":"Link"} ${i+1}`}</span>
      <span style={{marginLeft:"auto",fontSize:"0.72rem",opacity:0.4}}>Open ↗</span>
    </a>
  );
  return <div style={{padding:"6px 0"}}>{ap.map((p,i)=>row(p,i,true))}{al.map((l,i)=>row(l,i,false))}</div>;
}

// ════════════════════════════════════════════════════════
//  RESOURCE EDITOR
// ════════════════════════════════════════════════════════
function ResourceEditor({section,onChange}) {
  const upd=(type,idx,field,val)=>{const updated=section[type].map((it,i)=>i===idx?{...it,[field]:val}:it);onChange({...section,[type]:updated});};
  const row=(type,idx,item,ph)=>(
    <div key={idx} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:6}}>
      <input placeholder={`${ph} Label`} value={item.label} onChange={e=>upd(type,idx,"label",e.target.value)} style={{...IS,fontSize:"0.82rem"}}/>
      <input placeholder="https://..." value={item.url} onChange={e=>upd(type,idx,"url",e.target.value)} style={{...IS,fontSize:"0.82rem"}}/>
    </div>
  );
  return (
    <div>
      <div style={{fontWeight:700,fontSize:"0.75rem",textTransform:"uppercase",letterSpacing:"0.1em",opacity:0.5,marginBottom:8}}>📄 PDFs (up to 10)</div>
      {section.pdfs.map((it,i)=>row("pdfs",i,it,`PDF ${i+1}`))}
      <div style={{fontWeight:700,fontSize:"0.75rem",textTransform:"uppercase",letterSpacing:"0.1em",opacity:0.5,margin:"14px 0 8px"}}>🔗 Links (up to 5)</div>
      {section.links.map((it,i)=>row("links",i,it,`Link ${i+1}`))}
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  YEAR RESOURCES (student)
// ════════════════════════════════════════════════════════
const SECTION_META=[{key:"syllabus",label:"Syllabus",icon:"📘"},{key:"calendar",label:"Academic Calendar",icon:"📅"},{key:"pyq",label:"Previous Year Questions",icon:"📝"},{key:"notes",label:"Notes",icon:"📚"},{key:"timetable",label:"Lectures Time Table",icon:"⏱️"}];

function YearResources({year,resources}) {
  const [open,setOpen]=useState(null);
  const [openEx,setOpenEx]=useState(null);
  const r=resources[year];
  const Card=({icon,label,k})=>(
    <div style={{background:"var(--card)",border:`1.5px solid ${open===k?"var(--accent)":"var(--border)"}`,borderRadius:14,overflow:"hidden",marginBottom:10}}>
      <button onClick={()=>setOpen(v=>v===k?null:k)} style={{width:"100%",background:"none",border:"none",padding:"15px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",color:"var(--text)"}}>
        <span style={{display:"flex",gap:10,alignItems:"center",fontFamily:"var(--font-head)",fontWeight:700,fontSize:"0.93rem"}}><span style={{fontSize:"1.2rem"}}>{icon}</span>{label}</span>
        <span style={{opacity:0.5,fontSize:"0.8rem"}}>{open===k?"▲":"▼"}</span>
      </button>
      {open===k&&<div style={{padding:"0 18px 16px",borderTop:"1px solid var(--border)"}}><ResourceViewer section={r[k]}/></div>}
    </div>
  );
  return (
    <div>
      {SECTION_META.map(s=><Card key={s.key} icon={s.icon} label={s.label} k={s.key}/>)}
      <div style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:14,overflow:"hidden"}}>
        <div style={{padding:"15px 18px",fontFamily:"var(--font-head)",fontWeight:700,fontSize:"0.93rem",display:"flex",gap:10}}>📋 Exam Time Table</div>
        {(year===1
          ?[{sem:"sem1",label:"Semester I",mk:"examMid1",ek:"examEnd1"},{sem:"sem2",label:"Semester II",mk:"examMid2",ek:"examEnd2"}]
          :[{sem:"sem1",label:"Semester III",mk:"examMid1",ek:"examEnd1"},{sem:"sem2",label:"Semester IV",mk:"examMid2",ek:"examEnd2"}]
        ).map(({sem,label,mk,ek})=>(
          <div key={sem} style={{borderTop:"1px solid var(--border)"}}>
            <button onClick={()=>setOpenEx(v=>v===sem?null:sem)} style={{width:"100%",background:"none",border:"none",padding:"12px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",color:"var(--text)",fontFamily:"var(--font-head)",fontWeight:600,fontSize:"0.88rem"}}>
              <span>📖 {label}</span><span style={{opacity:0.5}}>{openEx===sem?"▲":"▼"}</span>
            </button>
            {openEx===sem&&(<div style={{padding:"0 18px 16px"}}><div style={{fontSize:"0.73rem",opacity:0.5,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Mid Term</div><ResourceViewer section={r[mk]}/><div style={{fontSize:"0.73rem",opacity:0.5,fontWeight:700,textTransform:"uppercase",margin:"10px 0 6px"}}>End Term</div><ResourceViewer section={r[ek]}/></div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function Year34Resources({year,resources}) {
  const [activeStream,setActiveStream]=useState(null);
  const [open,setOpen]=useState(null);
  const [openEx,setOpenEx]=useState(null);
  const r=resources[year];
  return (
    <div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:"0.75rem",opacity:0.45,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10,fontFamily:"var(--font-head)"}}>Select your Stream</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {STREAMS_34.map(s=>(
            <button key={s} onClick={()=>{setActiveStream(v=>v===s?null:s);setOpen(null);setOpenEx(null);}} style={{background:activeStream===s?"var(--accent)":"var(--card)",color:activeStream===s?"#fff":"var(--text)",border:`1.5px solid ${activeStream===s?"var(--accent)":"var(--border)"}`,borderRadius:10,padding:"9px 16px",cursor:"pointer",fontFamily:"var(--font-head)",fontWeight:700,fontSize:"0.82rem",transition:"all 0.18s"}}>{s}</button>
          ))}
        </div>
      </div>
      {activeStream&&(
        <div style={{animation:"fadeIn 0.3s ease"}}>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:"1rem",marginBottom:14,color:"var(--accent2)"}}>{activeStream} — Resources</div>
          {SECTION_META.map(s=>(
            <div key={s.key} style={{background:"var(--card)",border:`1.5px solid ${open===s.key?"var(--accent)":"var(--border)"}`,borderRadius:14,overflow:"hidden",marginBottom:10}}>
              <button onClick={()=>setOpen(v=>v===s.key?null:s.key)} style={{width:"100%",background:"none",border:"none",padding:"15px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",color:"var(--text)"}}>
                <span style={{display:"flex",gap:10,alignItems:"center",fontFamily:"var(--font-head)",fontWeight:700,fontSize:"0.93rem"}}><span style={{fontSize:"1.2rem"}}>{s.icon}</span>{s.label}</span>
                <span style={{opacity:0.5}}>{open===s.key?"▲":"▼"}</span>
              </button>
              {open===s.key&&<div style={{padding:"0 18px 16px",borderTop:"1px solid var(--border)"}}><ResourceViewer section={r[activeStream][s.key]}/></div>}
            </div>
          ))}
          <div style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:14,overflow:"hidden"}}>
            <div style={{padding:"15px 18px",fontFamily:"var(--font-head)",fontWeight:700,fontSize:"0.93rem"}}>📋 Exam Time Table</div>
            {(year===3
              ?[{sem:"sem1",label:"Semester V",mk:"examMid1",ek:"examEnd1"},{sem:"sem2",label:"Semester VI",mk:"examMid2",ek:"examEnd2"}]
              :[{sem:"sem1",label:"Semester VII",mk:"examMid1",ek:"examEnd1"},{sem:"sem2",label:"Semester VIII",mk:"examMid2",ek:"examEnd2"}]
            ).map(({sem,label,mk,ek})=>(
              <div key={sem} style={{borderTop:"1px solid var(--border)"}}>
                <button onClick={()=>setOpenEx(v=>v===sem?null:sem)} style={{width:"100%",background:"none",border:"none",padding:"12px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",color:"var(--text)",fontFamily:"var(--font-head)",fontWeight:600,fontSize:"0.88rem"}}>
                  <span>📖 {label}</span><span style={{opacity:0.5}}>{openEx===sem?"▲":"▼"}</span>
                </button>
                {openEx===sem&&(<div style={{padding:"0 18px 16px"}}><div style={{fontSize:"0.73rem",opacity:0.5,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Mid Term</div><ResourceViewer section={r[activeStream][mk]}/><div style={{fontSize:"0.73rem",opacity:0.5,fontWeight:700,textTransform:"uppercase",margin:"10px 0 6px"}}>End Term</div><ResourceViewer section={r[activeStream][ek]}/></div>)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  FIND FACULTY
// ════════════════════════════════════════════════════════
function FindFaculty({faculty}) {
  const [q,setQ]=useState("");
  const [open,setOpen]=useState(false);
  const [sel,setSel]=useState(null);
  const ref=useRef();
  const res=q.length>0?faculty.filter(f=>fuzzyMatch(f.name,q)||fuzzyMatch(f.dept,q)):[];
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  return (
    <div style={{maxWidth:520,margin:"0 auto"}}>
      <h3 style={{fontFamily:"var(--font-head)",marginBottom:6,fontSize:"1.1rem"}}>🔍 Search Faculty</h3>
      <p style={{fontSize:"0.85rem",opacity:0.6,marginBottom:18}}>Type a name or department to find their cabin location.</p>
      <div ref={ref} style={{position:"relative"}}>
        <input value={q} onChange={e=>{setQ(e.target.value);setOpen(true);setSel(null);}} onFocus={()=>q&&setOpen(true)} placeholder="e.g. Goyal, MFC, Design Thinking..." onKeyDown={e=>e.key==="Escape"&&setOpen(false)} style={{...IS,padding:"14px 18px",fontSize:"1rem",borderRadius:14,border:"2px solid var(--border)"}}/>
        {open&&res.length>0&&(
          <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:12,overflow:"hidden",zIndex:100,boxShadow:"0 8px 32px rgba(0,0,0,0.3)",maxHeight:280,overflowY:"auto"}}>
            {res.map(f=>(
              <div key={f.id} onClick={()=>{setSel(f);setQ(f.name);setOpen(false);}} style={{padding:"12px 18px",cursor:"pointer",borderBottom:"1px solid var(--border)"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,0.12)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{fontWeight:700,fontFamily:"var(--font-head)",fontSize:"0.9rem"}}>{f.name}</div>
                <div style={{fontSize:"0.75rem",opacity:0.5}}>{f.dept}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {sel&&(<div style={{marginTop:20,background:"var(--accent)",color:"#fff",borderRadius:14,padding:"20px 24px",animation:"fadeIn 0.3s ease"}}><div style={{fontSize:"0.7rem",opacity:0.8,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Faculty Found</div><div style={{fontFamily:"var(--font-head)",fontSize:"1.3rem",fontWeight:800,marginBottom:4}}>{sel.name}</div><div style={{opacity:0.85,fontSize:"0.88rem",marginBottom:10}}>{sel.dept}</div><div style={{background:"rgba(255,255,255,0.15)",borderRadius:10,padding:"10px 14px",display:"flex",gap:8,alignItems:"center"}}><span>📍</span><span style={{fontWeight:700}}>{sel.cabin}</span></div></div>)}
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  SGPA / CGPA
// ════════════════════════════════════════════════════════
function SGPACalculator() {
  const subjects=[{id:"science",label:"Applied Sciences (EP/MCD)",credits:3},{id:"maths",label:"Mathematics (MFC)",credits:3},{id:"extra",label:"Computational Thinking / Intro to Data Science",credits:2},{id:"programming",label:"Programming Language",credits:2},{id:"electronics",label:"Electronics Engineering (EEE/DELD)",credits:3},{id:"design",label:"Design Thinking",credits:2},{id:"workshop",label:"Computer & Workshop / IKS",credits:2},{id:"english",label:"English Communication",credits:2},{id:"health",label:"Health Practices-I",credits:2},{id:"capa",label:"CAPA",credits:2}];
  const [marks,setMarks]=useState({});const [result,setResult]=useState(null);const [err,setErr]=useState("");
  const calc=()=>{let tot=0,cr=0;for(const s of subjects){const m=Number(marks[s.id]??"");if(isNaN(m)||marks[s.id]===""||m<0||m>100){setErr(`Valid marks needed for "${s.label}"`);setResult(null);return;}tot+=getGradePoint(m)*s.credits;cr+=s.credits;}setErr("");setResult((tot/cr).toFixed(2));};
  return (
    <div style={{maxWidth:600,margin:"0 auto"}}>
      <h3 style={{fontFamily:"var(--font-head)",marginBottom:4,fontSize:"1.1rem"}}>📊 Semester 1 SGPA Calculator</h3>
      <p style={{fontSize:"0.82rem",background:"rgba(239,68,68,0.12)",color:"#ef4444",borderRadius:8,padding:"8px 14px",marginBottom:20,lineHeight:1.5}}>Enter marks out of 100. For subjects out of 50 (25+25), multiply × 2 first.</p>
      {subjects.map(s=>(<div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:10}}><label style={{fontSize:"0.88rem",flex:1,fontWeight:600}}>{s.label} <span style={{opacity:0.5,fontWeight:400}}>({s.credits} Cr)</span></label><input type="number" min="0" max="100" value={marks[s.id]??""} onChange={e=>setMarks(p=>({...p,[s.id]:e.target.value}))} style={{...IS,width:90,textAlign:"center",borderRadius:10}} placeholder="0–100"/></div>))}
      {err&&<p style={{color:"#ef4444",fontSize:"0.82rem",marginTop:12}}>{err}</p>}
      <button onClick={calc} style={{...BS("var(--accent)"),marginTop:20,width:"100%",padding:"14px",fontSize:"1rem",borderRadius:12}}>Calculate SGPA</button>
      {result!==null&&<div style={{marginTop:18,textAlign:"center",background:"var(--accent)",color:"#fff",borderRadius:14,padding:"20px",animation:"fadeIn 0.3s ease"}}><div style={{opacity:0.8,fontSize:"0.85rem",marginBottom:4}}>Your SGPA is</div><div style={{fontFamily:"var(--font-head)",fontSize:"3rem",fontWeight:900,lineHeight:1}}>{result}</div></div>}
    </div>
  );
}

function CGPACalculator({onGoSGPA}) {
  const [s1,setS1]=useState("");const [s2,setS2]=useState("");const [res,setRes]=useState(null);
  const calc=()=>{const a=parseFloat(s1),b=parseFloat(s2);if(isNaN(a)||isNaN(b)||a<0||a>10||b<0||b>10){alert("Enter valid SGPA (0–10).");return;}setRes(((a+b)/2).toFixed(2));};
  return (
    <div style={{maxWidth:420,margin:"0 auto"}}>
      <h3 style={{fontFamily:"var(--font-head)",marginBottom:6,fontSize:"1.1rem"}}>🎓 CGPA Calculator</h3>
      <p style={{fontSize:"0.83rem",opacity:0.65,marginBottom:20,lineHeight:1.6}}>To calculate SGPA first, use our <span onClick={onGoSGPA} style={{color:"var(--accent)",cursor:"pointer",fontWeight:700,textDecoration:"underline"}}>SGPA Calculator</span>.</p>
      {[{label:"SGPA – Semester 1",val:s1,set:setS1},{label:"SGPA – Semester 2",val:s2,set:setS2}].map(f=>(<div key={f.label} style={{marginBottom:16}}><label style={{fontSize:"0.88rem",fontWeight:700,display:"block",marginBottom:6}}>{f.label}</label><input type="number" step="0.01" min="0" max="10" value={f.val} onChange={e=>f.set(e.target.value)} placeholder="0.00 – 10.00" style={{...IS,padding:"12px 16px",fontSize:"1rem",borderRadius:12}}/></div>))}
      <button onClick={calc} style={{...BS("var(--accent)"),width:"100%",padding:"14px",fontSize:"1rem",borderRadius:12}}>Calculate CGPA</button>
      {res!==null&&<div style={{marginTop:18,textAlign:"center",background:"var(--accent)",color:"#fff",borderRadius:14,padding:"20px",animation:"fadeIn 0.3s ease"}}><div style={{opacity:0.8,fontSize:"0.85rem",marginBottom:4}}>Your CGPA is</div><div style={{fontFamily:"var(--font-head)",fontSize:"3rem",fontWeight:900,lineHeight:1}}>{res}</div></div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  RICH TEXT EDITOR
// ════════════════════════════════════════════════════════
const FONT_COLORS=["#e8eaf0","#ef4444","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ec4899","#06b6d4","#84cc16","#f97316"];
const HIGHLIGHT_COLORS=["#fef08a","#bbf7d0","#bfdbfe","#fecaca","#e9d5ff","#fed7aa","#a7f3d0","#fbcfe8","transparent"];

function RichEditor({value,onChange}) {
  const editorRef=useRef();
  const [showColors,setShowColors]=useState(false);
  const [showHighlight,setShowHighlight]=useState(false);
  const [showLink,setShowLink]=useState(false);
  const [linkUrl,setLinkUrl]=useState("");
  const [linkText,setLinkText]=useState("");
  const [savedRange,setSavedRange]=useState(null);
  const [activeAlign,setActiveAlign]=useState("Left");
  const fileRef=useRef();

  // Initialise editor HTML when editing an existing post
  useEffect(()=>{
    if(editorRef.current&&value&&editorRef.current.innerHTML!==value){
      editorRef.current.innerHTML=value;
    }
  },[]);

  const exec=(cmd,val=null)=>{
    editorRef.current.focus();
    document.execCommand(cmd,false,val);
    onChange(editorRef.current.innerHTML);
  };

  const saveRange=()=>{
    const sel=window.getSelection();
    if(sel&&sel.rangeCount>0) setSavedRange(sel.getRangeAt(0).cloneRange());
  };
  const restoreRange=()=>{
    if(!savedRange)return;
    const sel=window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
    editorRef.current.focus();
  };

  const applyColor=color=>{exec("foreColor",color);setShowColors(false);};
  const applyHighlight=color=>{
    if(color==="transparent"){exec("hiliteColor","transparent");exec("backColor","transparent");}
    else exec("hiliteColor",color);
    setShowHighlight(false);
  };
  const insertLink=()=>{
    restoreRange();
    const url=linkUrl.trim();
    const text=linkText.trim()||url;
    if(!url){alert("Enter a URL.");return;}
    const fullUrl=url.startsWith("http")?url:"https://"+url;
    document.execCommand("insertHTML",false,`<a href="${fullUrl}" target="_blank" rel="noopener" style="color:var(--accent2);text-decoration:underline;">${text}</a>`);
    onChange(editorRef.current.innerHTML);
    setShowLink(false);setLinkUrl("");setLinkText("");setSavedRange(null);
  };
  const handleFileAttach=e=>{
    const files=Array.from(e.target.files);
    files.forEach(file=>{
      const isImage=file.type.startsWith("image/");
      const isVideo=file.type.startsWith("video/");
      const isAudio=file.type.startsWith("audio/");
      const isPDF=file.type==="application/pdf";
      const reader=new FileReader();
      reader.onload=ev=>{
        editorRef.current.focus();
        let html="";
        if(isImage) html=`<img src="${ev.target.result}" alt="${file.name}" style="max-width:100%;border-radius:8px;margin:6px 0;display:block;"/>`;
        else if(isVideo) html=`<video controls style="max-width:100%;border-radius:8px;margin:6px 0;display:block;"><source src="${ev.target.result}" type="${file.type}"/>Your browser does not support video.</video>`;
        else if(isAudio) html=`<audio controls style="width:100%;margin:6px 0;display:block;"><source src="${ev.target.result}" type="${file.type}"/>Your browser does not support audio.</audio>`;
        else if(isPDF) html=`<a href="${ev.target.result}" download="${file.name}" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.3);border-radius:8px;color:var(--accent2);text-decoration:none;font-size:0.85rem;margin:4px 0;">📄 ${file.name}</a>`;
        else html=`<a href="${ev.target.result}" download="${file.name}" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.25);border-radius:8px;color:#10b981;text-decoration:none;font-size:0.85rem;margin:4px 0;">📎 ${file.name}</a>`;
        document.execCommand("insertHTML",false,html);
        onChange(editorRef.current.innerHTML);
      };
      reader.readAsDataURL(file);
    });
    e.target.value="";
  };

  const TB=({cmd,val,title,children,active,onClick})=>(
    <button type="button" title={title} onMouseDown={e=>{e.preventDefault();onClick?onClick():exec(cmd,val);}}
      style={{background:active?"rgba(99,102,241,0.25)":"transparent",border:"1px solid transparent",borderRadius:6,padding:"4px 7px",cursor:"pointer",color:active?"var(--accent2)":"var(--text)",fontSize:"0.85rem",display:"flex",alignItems:"center",justifyContent:"center",minWidth:28,transition:"background 0.15s"}}
      onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,0.15)"}
      onMouseLeave={e=>e.currentTarget.style.background=active?"rgba(99,102,241,0.25)":"transparent"}>
      {children}
    </button>
  );

  const Divider=()=><div style={{width:1,height:22,background:"var(--border)",margin:"0 3px"}}/>;

  const alignments=[{label:"Left",icon:"⬅",cmd:"justifyLeft"},{label:"Center",icon:"↔",cmd:"justifyCenter"},{label:"Right",icon:"➡",cmd:"justifyRight"},{label:"Justify",icon:"☰",cmd:"justifyFull"}];

  return (
    <div style={{border:"1.5px solid var(--border)",borderRadius:12,overflow:"visible",marginBottom:10,background:"var(--bg)"}}>
      {/* ── Toolbar ── */}
      <div style={{display:"flex",flexWrap:"wrap",gap:2,padding:"8px 10px",borderBottom:"1px solid var(--border)",background:"var(--card)",borderRadius:"12px 12px 0 0",position:"relative"}}>
        {/* Basic formatting */}
        <TB cmd="bold" title="Bold"><b>B</b></TB>
        <TB cmd="italic" title="Italic"><i>I</i></TB>
        <TB cmd="underline" title="Underline"><u>U</u></TB>
        <TB cmd="strikeThrough" title="Strikethrough"><s>S</s></TB>
        <Divider/>
        {/* Alignment */}
        {alignments.map(a=>(
          <TB key={a.label} cmd={a.cmd} title={`Align ${a.label}`} active={activeAlign===a.label} onClick={()=>{exec(a.cmd);setActiveAlign(a.label);}}>
            <span style={{fontSize:"0.75rem",fontWeight:700}}>{a.label==="Left"?"≡L":a.label==="Center"?"≡C":a.label==="Right"?"≡R":"≡J"}</span>
          </TB>
        ))}
        <Divider/>
        {/* Font colour */}
        <div style={{position:"relative"}}>
          <button type="button" title="Font Color" onMouseDown={e=>{e.preventDefault();saveRange();setShowColors(v=>!v);setShowHighlight(false);setShowLink(false);}}
            style={{background:"transparent",border:"1px solid transparent",borderRadius:6,padding:"4px 7px",cursor:"pointer",color:"var(--text)",fontSize:"0.82rem",display:"flex",flexDirection:"column",alignItems:"center",gap:1}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,0.15)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{fontWeight:800,fontSize:"0.88rem"}}>A</span>
            <div style={{width:16,height:3,background:"#ef4444",borderRadius:2}}/>
          </button>
          {showColors&&(
            <div style={{position:"absolute",top:"110%",left:0,zIndex:500,background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:10,padding:"8px",display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
              {FONT_COLORS.map(c=><button key={c} type="button" onMouseDown={e=>{e.preventDefault();applyColor(c);}} style={{width:22,height:22,background:c,border:"2px solid rgba(255,255,255,0.15)",borderRadius:5,cursor:"pointer"}}/>)}
            </div>
          )}
        </div>
        {/* Highlight */}
        <div style={{position:"relative"}}>
          <button type="button" title="Highlight" onMouseDown={e=>{e.preventDefault();saveRange();setShowHighlight(v=>!v);setShowColors(false);setShowLink(false);}}
            style={{background:"transparent",border:"1px solid transparent",borderRadius:6,padding:"4px 7px",cursor:"pointer",color:"var(--text)",fontSize:"0.82rem",display:"flex",flexDirection:"column",alignItems:"center",gap:1}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,0.15)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{fontWeight:800,fontSize:"0.88rem"}}>H</span>
            <div style={{width:16,height:3,background:"#fef08a",borderRadius:2}}/>
          </button>
          {showHighlight&&(
            <div style={{position:"absolute",top:"110%",left:0,zIndex:500,background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:10,padding:"8px",display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
              {HIGHLIGHT_COLORS.map(c=><button key={c} type="button" onMouseDown={e=>{e.preventDefault();applyHighlight(c);}} style={{width:22,height:22,background:c==="transparent"?"var(--bg)":c,border:"2px solid rgba(255,255,255,0.15)",borderRadius:5,cursor:"pointer",fontSize:c==="transparent"?"0.65rem":"inherit",color:c==="transparent"?"var(--muted)":"inherit"}}>{c==="transparent"?"✕":""}</button>)}
            </div>
          )}
        </div>
        <Divider/>
        {/* Insert link */}
        <div style={{position:"relative"}}>
          <button type="button" title="Insert Link" onMouseDown={e=>{e.preventDefault();saveRange();setShowLink(v=>!v);setShowColors(false);setShowHighlight(false);}}
            style={{background:showLink?"rgba(99,102,241,0.25)":"transparent",border:"1px solid transparent",borderRadius:6,padding:"4px 7px",cursor:"pointer",color:showLink?"var(--accent2)":"var(--text)",fontSize:"0.82rem"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,0.15)"} onMouseLeave={e=>e.currentTarget.style.background=showLink?"rgba(99,102,241,0.25)":"transparent"}>
            🔗
          </button>
          {showLink&&(
            <div style={{position:"absolute",top:"110%",left:0,zIndex:500,background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:10,padding:"12px",boxShadow:"0 8px 24px rgba(0,0,0,0.4)",width:260}}>
              <div style={{fontSize:"0.75rem",fontWeight:700,opacity:0.6,marginBottom:6}}>Insert Link</div>
              <input placeholder="Display text (optional)" value={linkText} onChange={e=>setLinkText(e.target.value)} style={{...IS,marginBottom:6,fontSize:"0.82rem"}}/>
              <input placeholder="https://example.com" value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&insertLink()} style={{...IS,marginBottom:8,fontSize:"0.82rem"}}/>
              <div style={{display:"flex",gap:6}}>
                <button type="button" onMouseDown={e=>{e.preventDefault();insertLink();}} style={{...BS("var(--accent)"),flex:1,padding:"6px",fontSize:"0.8rem"}}>Insert</button>
                <button type="button" onMouseDown={e=>{e.preventDefault();setShowLink(false);}} style={{...BS("transparent"),color:"var(--muted)",border:"1.5px solid var(--border)",padding:"6px 10px",fontSize:"0.8rem"}}>✕</button>
              </div>
            </div>
          )}
        </div>
        {/* Attach files */}
        <button type="button" title="Attach File (PDF, Image, Video, Audio)" onMouseDown={e=>{e.preventDefault();fileRef.current.click();}}
          style={{background:"transparent",border:"1px solid transparent",borderRadius:6,padding:"4px 7px",cursor:"pointer",color:"var(--text)",fontSize:"0.85rem"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(99,102,241,0.15)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          📎
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt" multiple style={{display:"none"}} onChange={handleFileAttach}/>
      </div>
      {/* ── Editable area ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={()=>onChange(editorRef.current.innerHTML)}
        onClick={()=>{setShowColors(false);setShowHighlight(false);}}
        data-placeholder="Write your post body here…"
        style={{minHeight:120,padding:"12px 14px",outline:"none",fontSize:"0.88rem",lineHeight:1.8,color:"var(--text)",background:"transparent",borderRadius:"0 0 12px 12px",cursor:"text",overflowWrap:"break-word",wordBreak:"break-word"}}
      />
      <style>{`[contenteditable]:empty:before{content:attr(data-placeholder);color:var(--muted);pointer-events:none;}`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  POST FORM (admin)
// ════════════════════════════════════════════════════════
function PostForm({initial,onSave,onCancel,label,ticketEvents}) {
  const blank={title:"",body:"",tag:"Notice",hasTicket:false,ticketEventId:"",poll:null};
  const [f,setF]=useState(initial||blank);
  const [pollQ,setPollQ]=useState(initial?.poll?.question||"");
  const [pollOpts,setPollOpts]=useState(initial?.poll?.options||["",""]);
  const [hasPoll,setHasPoll]=useState(!!initial?.poll);
  const addOpt=()=>pollOpts.length<6&&setPollOpts(p=>[...p,""]);
  const removeOpt=i=>pollOpts.length>2&&setPollOpts(p=>p.filter((_,j)=>j!==i));
  const setOpt=(i,v)=>setPollOpts(p=>p.map((o,j)=>j===i?v:o));
  const submit=()=>{
    // Strip HTML tags just for the empty check
    const textOnly=(editorRef.current?.innerText||f.body||"").trim();
    if(!f.title.trim()||!textOnly){alert("Fill title and body.");return;}
    const poll=hasPoll&&pollQ.trim()&&pollOpts.filter(o=>o.trim()).length>=2?{question:pollQ,options:pollOpts.filter(o=>o.trim()),votes:pollOpts.filter(o=>o.trim()).map(()=>0)}:null;
    onSave({...f,poll});
  };
  // Keep a ref to the editor so submit can check innerText for empty
  const editorRef=useRef();
  const handleBodyChange=html=>{setF(p=>({...p,body:html}));};
  return (
    <div style={{background:"var(--card)",border:"2px dashed var(--accent)",borderRadius:14,padding:"20px",marginBottom:24}}>
      <div style={{fontFamily:"var(--font-head)",fontWeight:800,marginBottom:14,color:"var(--accent)"}}>{label}</div>
      <input placeholder="Post Title" value={f.title} onChange={e=>setF(p=>({...p,title:e.target.value}))} style={{...IS,marginBottom:10}}/>
      {/* Rich text editor replaces plain textarea */}
      <RichEditor value={f.body} onChange={handleBodyChange}/>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
        <select value={f.tag} onChange={e=>setF(p=>({...p,tag:e.target.value}))} style={{...IS,width:"auto",cursor:"pointer"}}>
          {["Event","Club","Notice","Admin"].map(t=><option key={t}>{t}</option>)}
        </select>
        <button type="button" onClick={()=>setHasPoll(v=>!v)} style={{...BS(hasPoll?"#10b981":"var(--card)"),color:hasPoll?"#fff":"var(--muted)",border:"1.5px solid var(--border)"}}>📊 {hasPoll?"Remove Poll":"Add Poll"}</button>
        <button type="button" onClick={()=>setF(p=>({...p,hasTicket:!p.hasTicket}))} style={{...BS(f.hasTicket?"#f59e0b":"var(--card)"),color:f.hasTicket?"#fff":"var(--muted)",border:"1.5px solid var(--border)"}}>🎟️ {f.hasTicket?"Ticket On":"Add Ticket"}</button>
      </div>
      {f.hasTicket&&ticketEvents.length>0&&(
        <div style={{marginBottom:12}}>
          <div style={{fontSize:"0.78rem",opacity:0.6,marginBottom:6}}>Link to ticket event:</div>
          <select value={f.ticketEventId} onChange={e=>setF(p=>({...p,ticketEventId:e.target.value}))} style={{...IS,width:"auto",cursor:"pointer"}}>
            <option value="">— Select event —</option>
            {ticketEvents.map(te=><option key={te.id} value={te.id}>{te.eventName}</option>)}
          </select>
        </div>
      )}
      {f.hasTicket&&ticketEvents.length===0&&<p style={{fontSize:"0.78rem",color:"#f59e0b",marginBottom:10}}>⚠ No ticket events created yet. Go to the Ticket Portal admin to create one first.</p>}
      {hasPoll&&(
        <div style={{background:"rgba(99,102,241,0.08)",borderRadius:12,padding:"14px",marginBottom:12}}>
          <div style={{fontSize:"0.78rem",opacity:0.6,marginBottom:8}}>Poll Question</div>
          <input value={pollQ} onChange={e=>setPollQ(e.target.value)} placeholder="e.g. Which topic next week?" style={{...IS,marginBottom:10}}/>
          <div style={{fontSize:"0.78rem",opacity:0.6,marginBottom:8}}>Options</div>
          {pollOpts.map((o,i)=>(<div key={i} style={{display:"flex",gap:8,marginBottom:6}}><input value={o} onChange={e=>setOpt(i,e.target.value)} placeholder={`Option ${i+1}`} style={{...IS}}/>{pollOpts.length>2&&<button onClick={()=>removeOpt(i)} style={{...BS("#ef4444"),padding:"6px 12px",flexShrink:0}}>✕</button>}</div>))}
          {pollOpts.length<6&&<button onClick={addOpt} style={{...BS("var(--card)"),color:"var(--muted)",border:"1.5px solid var(--border)",marginTop:4}}>+ Add Option</button>}
        </div>
      )}
      <div style={{display:"flex",gap:10}}>
        <button onClick={submit} style={{...BS("var(--accent)"),flex:1,padding:"10px 24px",fontSize:"0.95rem"}}>🚀 {label.includes("Edit")?"Save Changes":"Publish"}</button>
        {onCancel&&<button onClick={onCancel} style={{...BS("transparent"),color:"var(--muted)",border:"1.5px solid var(--border)"}}>Cancel</button>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  CLUB / EVENTS FEED
// ════════════════════════════════════════════════════════
function ClubEvents({adminLoggedIn,posts,setPosts,ticketEvents,onOpenTicket,focusPostId}) {
  const [editId,setEditId]=useState(null);
  const [delId,setDelId]=useState(null);
  const [votedPosts,setVotedPosts]=useState({});
  const [reactionMap,setReactionMap]=useState({});
  const [copied,setCopied]=useState(null);
  const [filterTag,setFilterTag]=useState("All");
  const focusRef=useRef();

  const livePosts=posts.filter(p=>(Date.now()-p.date)<TWO_YEARS_MS);
  useEffect(()=>{if(livePosts.length!==posts.length)setPosts(livePosts);},[]);
  useEffect(()=>{if(focusPostId&&focusRef.current){focusRef.current.scrollIntoView({behavior:"smooth",block:"center"});}},[focusPostId]);

  const sorted=[...livePosts].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(b.date-a.date));
  const filtered=filterTag==="All"?sorted:sorted.filter(p=>p.tag===filterTag);

  const publish=f=>setPosts(p=>[{id:genId(),...f,date:Date.now(),pinned:false,likes:0,dislikes:0,edited:false},...p]);
  const saveEdit=(id,f)=>{setPosts(p=>p.map(post=>post.id===id?{...post,...f,edited:true}:post));setEditId(null);};
  const del=id=>{setPosts(p=>p.filter(post=>post.id!==id));setDelId(null);};
  const togglePin=id=>setPosts(p=>p.map(post=>post.id===id?{...post,pinned:!post.pinned}:post));
  const react=(id,type)=>{
    const prev=reactionMap[id];
    if(prev===type)return;
    setPosts(p=>p.map(post=>{if(post.id!==id)return post;let likes=post.likes,dislikes=post.dislikes;if(prev==="like")likes--;if(prev==="dislike")dislikes--;if(type==="like")likes++;if(type==="dislike")dislikes++;return{...post,likes,dislikes};}));
    setReactionMap(p=>({...p,[id]:type}));
  };
  const vote=(postId,optIdx)=>{
    if(votedPosts[postId]!==undefined)return;
    setPosts(p=>p.map(post=>{if(post.id!==postId||!post.poll)return post;const votes=[...post.poll.votes];votes[optIdx]=(votes[optIdx]||0)+1;return{...post,poll:{...post.poll,votes}};}));
    setVotedPosts(p=>({...p,[postId]:optIdx}));
  };
  const share=postId=>{
    const url=`${window.location.href.split("?")[0]}?post=${postId}`;
    navigator.clipboard.writeText(url).catch(()=>{});
    setCopied(postId);setTimeout(()=>setCopied(null),2000);
  };
  const IB=(onClick,emoji,label,color)=>(
    <button onClick={onClick} style={{background:"transparent",border:`1.5px solid ${color}33`,borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:"0.8rem",color,display:"flex",alignItems:"center",gap:4}} onMouseEnter={e=>e.currentTarget.style.background=color+"22"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      {emoji}<span style={{fontSize:"0.7rem",fontWeight:700}}>{label}</span>
    </button>
  );

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:20}}>
        <h3 style={{fontFamily:"var(--font-head)",fontSize:"1.1rem"}}>📢 Club & Events Feed</h3>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["All","Event","Club","Notice","Admin"].map(t=>(
            <button key={t} onClick={()=>setFilterTag(t)} style={{...BS(filterTag===t?"var(--accent)":"transparent"),color:filterTag===t?"#fff":"var(--muted)",border:"1.5px solid var(--border)",padding:"5px 12px",fontSize:"0.78rem",borderRadius:20}}>{t}</button>
          ))}
        </div>
      </div>
      {adminLoggedIn&&editId===null&&<PostForm label="✏️ Post New Circular" onSave={publish} ticketEvents={ticketEvents}/>}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 20px",opacity:0.4}}>No posts in this category yet.</div>}
        {filtered.map(p=>(
          <div key={p.id} ref={focusPostId===p.id?focusRef:null}
            style={{background:"var(--card)",border:p.pinned?"2px solid var(--accent)":"1.5px solid var(--border)",borderRadius:14,padding:"18px 20px",animation:"fadeIn 0.3s ease",position:"relative",boxShadow:focusPostId===p.id?"0 0 0 3px rgba(99,102,241,0.4)":"none"}}>
            {p.pinned&&<div style={{position:"absolute",top:-1,right:16,background:"var(--accent)",color:"#fff",fontSize:"0.62rem",fontWeight:800,padding:"3px 10px",borderRadius:"0 0 8px 8px",fontFamily:"var(--font-head)",textTransform:"uppercase"}}>📌 Pinned</div>}
            {editId===p.id?(
              <PostForm label="✏️ Edit Post" initial={p} onSave={f=>saveEdit(p.id,f)} onCancel={()=>setEditId(null)} ticketEvents={ticketEvents}/>
            ):(
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:8,flexWrap:"wrap"}}>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:"1rem",paddingRight:p.pinned?70:0}}>{p.title}</div>
                  <Tag text={p.tag}/>
                </div>
                <div style={{fontSize:"0.88rem",lineHeight:1.7,opacity:0.8,marginBottom:12}} className="post-body" dangerouslySetInnerHTML={{__html:p.body}}/>
                {p.poll&&(
                  <div style={{background:"rgba(99,102,241,0.08)",borderRadius:12,padding:"14px",marginBottom:12}}>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:"0.88rem",marginBottom:10}}>📊 {p.poll.question}</div>
                    {p.poll.options.map((opt,i)=>{const total=p.poll.votes.reduce((a,b)=>a+b,0)||1;const pct=Math.round((p.poll.votes[i]/total)*100);const voted=votedPosts[p.id]!==undefined;return(
                      <div key={i} onClick={()=>vote(p.id,i)} style={{marginBottom:8,cursor:voted?"default":"pointer"}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.83rem",marginBottom:4}}><span style={{fontWeight:votedPosts[p.id]===i?700:400}}>{voted&&votedPosts[p.id]===i?"✅ ":""}{opt}</span>{voted&&<span style={{opacity:0.6}}>{pct}%</span>}</div>
                        <div style={{background:"rgba(255,255,255,0.08)",borderRadius:6,height:8,overflow:"hidden"}}><div style={{width:voted?`${pct}%`:"0%",background:"var(--accent)",height:"100%",borderRadius:6,transition:"width 0.5s ease"}}/></div>
                      </div>
                    );})}
                    {votedPosts[p.id]!==undefined&&<div style={{fontSize:"0.72rem",opacity:0.4,marginTop:6}}>{p.poll.votes.reduce((a,b)=>a+b,0)} total votes</div>}
                  </div>
                )}
                {p.hasTicket&&(
                  <button onClick={()=>onOpenTicket(p.ticketEventId)} style={{...BS("#f59e0b"),marginBottom:12,display:"flex",alignItems:"center",gap:8,borderRadius:10}}>🎟️ Book Tickets</button>
                )}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                  <div style={{fontSize:"0.75rem",opacity:0.45}}>📅 {fmtDate(p.date)}{p.edited?" · ✏️ edited":""}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                    <button onClick={()=>react(p.id,"like")} style={{...BS(reactionMap[p.id]==="like"?"#10b981":"transparent"),color:reactionMap[p.id]==="like"?"#fff":"var(--muted)",border:"1.5px solid var(--border)",padding:"5px 12px",fontSize:"0.82rem"}}>👍 {p.likes}</button>
                    <button onClick={()=>react(p.id,"dislike")} style={{...BS(reactionMap[p.id]==="dislike"?"#ef4444":"transparent"),color:reactionMap[p.id]==="dislike"?"#fff":"var(--muted)",border:"1.5px solid var(--border)",padding:"5px 12px",fontSize:"0.82rem"}}>👎 {p.dislikes}</button>
                    {IB(()=>share(p.id),copied===p.id?"✅":"🔗",copied===p.id?"Copied!":"Share","#a78bfa")}
                    {adminLoggedIn&&<>
                      {IB(()=>togglePin(p.id),p.pinned?"📌":"📍",p.pinned?"Unpin":"Pin","#6366f1")}
                      {IB(()=>{setEditId(p.id);setDelId(null);},"✏️","Edit","#10b981")}
                      {delId===p.id?(<div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:"0.75rem",color:"#ef4444",fontWeight:700}}>Delete?</span><button onClick={()=>del(p.id)} style={{...BS("#ef4444"),padding:"5px 12px",fontSize:"0.78rem",borderRadius:8}}>Yes</button><button onClick={()=>setDelId(null)} style={{...BS("transparent"),color:"var(--muted)",border:"1.5px solid var(--border)",padding:"5px 10px",fontSize:"0.78rem",borderRadius:8}}>No</button></div>):IB(()=>{setDelId(p.id);setEditId(null);},"🗑️","Delete","#ef4444")}
                    </>}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  TICKET PORTAL (student)
// ════════════════════════════════════════════════════════
function TicketPortal({ticketEvents,onSubmitRegistration,initialEventId}) {
  const [selEvent,setSelEvent]=useState(initialEventId||null);
  const blank={collegeName:"",collegeId:"",universityName:"",userName:"",academicYear:"FY",email:"",whatsapp:"",phone:"",transactionId:"",screenshotName:"",screenshot:null};
  const [form,setForm]=useState(blank);
  const [submitted,setSubmitted]=useState(false);
  const [receiptData,setReceiptData]=useState(null);

  const live=ticketEvents.filter(e=>e.status==="live"&&Number(e.seats)>0);

  useEffect(()=>{if(initialEventId)setSelEvent(initialEventId);},[initialEventId]);

  const reset=()=>{setSubmitted(false);setSelEvent(null);setForm(blank);setReceiptData(null);};

  if(submitted&&receiptData) return (
    <div style={{maxWidth:600,margin:"0 auto",padding:"20px 0"}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:"3rem",marginBottom:10}}>✅</div>
        <h2 style={{fontFamily:"var(--font-head)",fontSize:"1.5rem",fontWeight:900,marginBottom:6}}>Registration Submitted!</h2>
        <p style={{opacity:0.6,fontSize:"0.88rem",lineHeight:1.7}}>Your registration is under review. Once approved, you'll receive a confirmation on your email and WhatsApp.<br/>Please carry your college ID proof on the day of the event.</p>
      </div>
      {/* Receipt */}
      <div style={{background:"var(--card)",border:"2px solid var(--accent)",borderRadius:16,padding:"24px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,paddingBottom:12,borderBottom:"1px dashed var(--border)"}}>
          <div><div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:"1.1rem",color:"var(--accent)"}}>📋 Registration Receipt</div><div style={{fontSize:"0.72rem",opacity:0.5,marginTop:2}}>Keep this for reference</div></div>
          <div style={{background:"rgba(245,158,11,0.15)",border:"1.5px solid #f59e0b44",borderRadius:10,padding:"6px 14px",fontSize:"0.78rem",fontWeight:800,color:"#f59e0b"}}>PENDING</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 20px",fontSize:"0.83rem"}}>
          {[["Event",receiptData.eventName],["Amount",`₹${receiptData.amount}`],["Name",receiptData.userName],["College",receiptData.collegeName],["College ID",receiptData.collegeId],["University",receiptData.universityName||"—"],["Academic Year",receiptData.academicYear],["Email",receiptData.email],["WhatsApp",receiptData.whatsapp],["Phone",receiptData.phone||receiptData.whatsapp],["Transaction ID",receiptData.transactionId],["Submitted",fmtDateTime(receiptData.submittedAt)]].map(([k,v])=>(
            <div key={k}><div style={{opacity:0.45,fontSize:"0.72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>{k}</div><div style={{fontWeight:600,marginTop:2,wordBreak:"break-all"}}>{v}</div></div>
          ))}
        </div>
        <div style={{marginTop:14,padding:"10px 14px",background:"rgba(245,158,11,0.1)",borderRadius:10,fontSize:"0.78rem",color:"#f59e0b",fontWeight:600}}>⚠️ Compulsorily carry your college ID proof on the day of the event.</div>
      </div>
      <button onClick={reset} style={{...BS("var(--accent)"),width:"100%",padding:"12px",borderRadius:12}}>← Back to Events</button>
    </div>
  );

  if(selEvent) {
    const ev=ticketEvents.find(e=>e.id===selEvent);
    if(!ev) return <div><button onClick={()=>setSelEvent(null)} style={{...BS("transparent"),color:"var(--muted)",border:"1.5px solid var(--border)"}}>← Back</button><p style={{marginTop:20,opacity:0.5}}>Event not found.</p></div>;
    const upd=f=>setForm(p=>({...p,...f}));
    const submit=()=>{
      if(!form.collegeName||!form.collegeId||!form.userName||!form.email||!form.whatsapp||!form.transactionId){alert("Please fill all required fields.");return;}
      const reg={...form,eventId:ev.id,eventName:ev.eventName,amount:ev.amount,id:genId(),status:"pending",submittedAt:Date.now()};
      onSubmitRegistration(reg);
      setReceiptData(reg);
      setSubmitted(true);
    };
    return (
      <div style={{maxWidth:600,margin:"0 auto"}}>
        <button onClick={()=>setSelEvent(null)} style={{...BS("transparent"),color:"var(--muted)",border:"1.5px solid var(--border)",marginBottom:20}}>← Back</button>
        <div style={{background:"var(--accent)",color:"#fff",borderRadius:14,padding:"20px 24px",marginBottom:24}}>
          <div style={{fontSize:"0.7rem",opacity:0.8,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Booking for</div>
          <div style={{fontFamily:"var(--font-head)",fontSize:"1.4rem",fontWeight:900}}>{ev.eventName}</div>
          <div style={{display:"flex",gap:20,marginTop:10,flexWrap:"wrap"}}><span>💰 ₹{ev.amount}</span><span>🪑 {ev.seats} seats left</span>{ev.eventDate&&<span>📅 {new Date(ev.eventDate+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span>}{ev.offer&&<span>🎁 {ev.offer}</span>}</div>
        </div>
        {ev.qrUrl&&<div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:"0.85rem",opacity:0.6,marginBottom:8}}>Scan to Pay via UPI</div><img src={ev.qrUrl} alt="UPI QR" style={{width:180,height:180,borderRadius:12,border:"2px solid var(--border)"}} onError={e=>e.target.style.display="none"}/></div>}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[["collegeName","College Name *"],["collegeId","College ID Number *"],["universityName","University Name"],["userName","Your Full Name *"],["email","Email ID *"],["whatsapp","WhatsApp Number *"],["phone","Phone Number (Call) — same if same"],["transactionId","Transaction ID *"]].map(([k,lbl])=>(
            <div key={k}><label style={{fontSize:"0.82rem",fontWeight:700,display:"block",marginBottom:4}}>{lbl}</label><input value={form[k]} onChange={e=>upd({[k]:e.target.value})} placeholder={lbl.replace(" *","")} style={IS}/></div>
          ))}
          <div><label style={{fontSize:"0.82rem",fontWeight:700,display:"block",marginBottom:4}}>Academic Year *</label><select value={form.academicYear} onChange={e=>upd({academicYear:e.target.value})} style={{...IS,cursor:"pointer"}}>{["FY","SY","TY","LY"].map(y=><option key={y}>{y}</option>)}</select></div>
          <div><label style={{fontSize:"0.82rem",fontWeight:700,display:"block",marginBottom:4}}>Payment Screenshot (with sender's name & bank details) *</label><input type="file" accept="image/*" onChange={e=>{const file=e.target.files[0];if(file){const reader=new FileReader();reader.onload=ev2=>upd({screenshotName:file.name,screenshot:ev2.target.result});reader.readAsDataURL(file);}}} style={{...IS,cursor:"pointer"}}/>{form.screenshotName&&<div style={{fontSize:"0.78rem",opacity:0.5,marginTop:4}}>📎 {form.screenshotName}</div>}</div>
        </div>
        <p style={{fontSize:"0.78rem",color:"#f59e0b",marginTop:16,lineHeight:1.6}}>⚠ Please carry your college ID proof compulsorily on the day of the event.</p>
        <button onClick={submit} style={{...BS("var(--accent)"),width:"100%",padding:"14px",fontSize:"1rem",marginTop:16,borderRadius:12}}>Submit Registration</button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{fontFamily:"var(--font-head)",fontSize:"1.4rem",fontWeight:900,marginBottom:6}}>🎟️ Event Ticket Portal</h2>
      <p style={{opacity:0.55,fontSize:"0.88rem",marginBottom:24}}>Browse live events and book your tickets below.</p>
      {live.length===0&&<div style={{textAlign:"center",padding:"40px 20px",opacity:0.4}}>No live ticket events at the moment. Check back soon!</div>}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {live.map(ev=>(
          <div key={ev.id} style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:14,padding:"20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:14}}>
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:"1.05rem",marginBottom:6}}>{ev.eventName}</div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:"0.85rem",opacity:0.8}}>
                <span>💰 ₹{ev.amount}</span><span>🪑 {ev.seats} seats left</span>
                {ev.eventDate&&<span style={{color:"var(--accent2)",fontWeight:600}}>📅 {new Date(ev.eventDate+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span>}
                {ev.offer&&<span style={{color:"#f59e0b",fontWeight:700}}>🎁 {ev.offer}</span>}
              </div>
            </div>
            <button onClick={()=>setSelEvent(ev.id)} style={{...BS("#f59e0b"),padding:"12px 24px",fontSize:"0.92rem"}}>Book Now →</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  TICKET ADMIN PORTAL
// ════════════════════════════════════════════════════════
function TicketAdminPortal({ticketEvents,setTicketEvents,registrations,setRegistrations}) {
  const [tab,setTab]=useState("events");
  const [showNew,setShowNew]=useState(false);
  const [newEv,setNewEv]=useState({eventName:"",eventDate:"",amount:"",seats:"",offer:"",qrUrl:"",qrPreview:"",status:"live"});
  const [rejReasons,setRejReasons]=useState({});
  const [selReg,setSelReg]=useState(null);
  const [filterEvent,setFilterEvent]=useState("All");
  const [viewTicket,setViewTicket]=useState(null);

  const handleQrUpload=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{setNewEv(p=>({...p,qrUrl:ev.target.result,qrPreview:ev.target.result}));};reader.readAsDataURL(file);};

  const createEvent=()=>{
    if(!newEv.eventName||!newEv.amount||!newEv.seats){alert("Fill event name, amount and seats.");return;}
    setTicketEvents(p=>[...p,{...newEv,id:genId(),seatsTotal:Number(newEv.seats)}]);
    setNewEv({eventName:"",eventDate:"",amount:"",seats:"",offer:"",qrUrl:"",qrPreview:"",status:"live"});
    setShowNew(false);
  };

  const approve=id=>{
    const reg=registrations.find(r=>r.id===id);
    if(!reg)return;
    setTicketEvents(p=>p.map(ev=>ev.id===reg.eventId?{...ev,seats:Math.max(0,Number(ev.seats)-1)}:ev));
    const now=Date.now();
    // Serial = count of already-approved tickets for this event + 1
    const evApproved=registrations.filter(r=>r.eventId===reg.eventId&&r.status==="approved");
    const serial=String(evApproved.length+1).padStart(4,"0");
    const dateStr=new Date(now).toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"}).replace(/\//g,"-");
    const safeName=reg.eventName.replace(/[^a-zA-Z0-9]/g,"_").replace(/_+/g,"_");
    const ticketNo=`${safeName}_${dateStr}_${serial}`;
    setRegistrations(p=>p.map(r=>r.id===id?{...r,status:"approved",ticketNo,approvedAt:now}:r));
  };

  const downloadTicket=(regId)=>{
    const reg=registrations.find(r=>r.id===regId);
    if(!reg)return;
    const ev=ticketEvents.find(e=>e.id===reg.eventId);
    const evDateStr=ev?.eventDate?new Date(ev.eventDate+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"";
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ticket - ${reg.ticketNo}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#0f1117;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;}
  .ticket{width:520px;background:linear-gradient(135deg,#6366f1 0%,#7c3aed 100%);border-radius:20px;padding:32px;color:#fff;position:relative;overflow:hidden;box-shadow:0 20px 60px rgba(99,102,241,0.4);}
  .circle1{position:absolute;top:-20px;right:-20px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.08);}
  .circle2{position:absolute;bottom:-30px;left:-10px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,0.05);}
  .inner{position:relative;z-index:1;}
  .badge{font-size:0.68rem;opacity:0.8;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:6px;}
  .event{font-size:1.7rem;font-weight:900;letter-spacing:-0.01em;margin-bottom:2px;}
  .college{opacity:0.75;font-size:0.88rem;margin-bottom:6px;}
  .ev-date{opacity:0.95;font-size:0.86rem;font-weight:700;margin-bottom:22px;}
  .info-box{background:rgba(255,255,255,0.15);border-radius:14px;padding:16px 20px;margin-bottom:18px;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;}
  .field-label{opacity:0.6;font-size:0.68rem;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:2px;}
  .field-val{font-weight:700;font-size:0.88rem;}
  .divider{border:none;border-top:2px dashed rgba(255,255,255,0.3);margin:16px 0;}
  .footer-row{display:flex;justify-content:space-between;align-items:flex-end;}
  .ticket-no-label{opacity:0.7;font-size:0.68rem;text-transform:uppercase;margin-bottom:3px;}
  .ticket-no{font-weight:900;font-size:0.95rem;letter-spacing:0.06em;font-family:monospace;}
  .amount-label{opacity:0.7;font-size:0.68rem;text-transform:uppercase;margin-bottom:3px;text-align:right;}
  .amount{font-weight:900;font-size:1.15rem;text-align:right;}
  .approved-badge{margin-top:14px;padding:9px 14px;background:rgba(255,255,255,0.15);border-radius:8px;font-size:0.77rem;font-weight:700;}
  .warning{margin-top:8px;padding:9px 14px;background:rgba(239,68,68,0.28);border-radius:8px;font-size:0.74rem;font-weight:600;}
  .print-note{text-align:center;color:#8891a8;font-size:0.75rem;margin-top:20px;}
  @media print{body{background:#fff;padding:0;}  .print-note{display:none;}}
</style></head><body>
<div>
  <div class="ticket">
    <div class="circle1"></div><div class="circle2"></div>
    <div class="inner">
      <div class="badge">🎟 Event Ticket</div>
      <div class="event">${reg.eventName}</div>
      <div class="college">Your College CSE Department</div>
      ${evDateStr?`<div class="ev-date">📅 Event Date: ${evDateStr}</div>`:""}
      <div class="info-box">
        <div class="grid">
          ${[["Name",reg.userName],["College",reg.collegeName],["College ID",reg.collegeId],["Academic Year",reg.academicYear],["University",reg.universityName||"—"],["Email",reg.email]].map(([k,v])=>`<div><div class="field-label">${k}</div><div class="field-val">${v}</div></div>`).join("")}
        </div>
      </div>
      <hr class="divider"/>
      <div class="footer-row">
        <div><div class="ticket-no-label">Ticket No.</div><div class="ticket-no">${reg.ticketNo}</div></div>
        <div><div class="amount-label">Amount Paid</div><div class="amount">₹${reg.amount}</div></div>
      </div>
      <div class="approved-badge">✅ APPROVED — ${fmtDateTime(reg.approvedAt||Date.now())}</div>
      <div class="warning">⚠️ Carry college ID proof compulsorily on the day of the event</div>
    </div>
  </div>
  <div class="print-note">Print or save this ticket as PDF using Ctrl+P / Cmd+P</div>
</div>
</body></html>`;
    const dataUri=`data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    const a=document.createElement("a");
    a.href=dataUri;
    a.download=`${reg.ticketNo}.html`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
  };
  const [delEvId,setDelEvId]=useState(null);

  const deleteEvent=(id)=>{
    setTicketEvents(p=>p.filter(e=>e.id!==id));
    setRegistrations(p=>p.filter(r=>r.eventId!==id));
    setDelEvId(null);
  };

  const reject=id=>{
    const reason=rejReasons[id];
    if(!reason?.trim()){alert("Please enter a rejection reason.");return;}
    setRegistrations(p=>p.map(r=>r.id===id?{...r,status:"rejected",rejReason:reason,rejectedAt:Date.now()}:r));
    setSelReg(null);
  };

  const downloadRejectedTicket=(regId)=>{
    const reg=registrations.find(r=>r.id===regId);
    if(!reg)return;
    const ev=ticketEvents.find(e=>e.id===reg.eventId);
    const evDateStr=ev?.eventDate?new Date(ev.eventDate+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"";
    const safeId=`REJ-${reg.eventName.slice(0,4).toUpperCase().replace(/\s/g,"")}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Rejected - ${safeId}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#0f1117;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;}
  .ticket{width:520px;background:linear-gradient(135deg,#1f1f2e 0%,#2d1a1a 100%);border:2px solid #ef4444;border-radius:20px;padding:32px;color:#fff;position:relative;overflow:hidden;box-shadow:0 20px 60px rgba(239,68,68,0.25);}
  .stamp{position:absolute;top:24px;right:24px;border:4px solid rgba(239,68,68,0.7);border-radius:8px;padding:6px 14px;font-size:1.1rem;font-weight:900;color:rgba(239,68,68,0.7);letter-spacing:0.1em;transform:rotate(12deg);}
  .inner{position:relative;z-index:1;}
  .badge{font-size:0.68rem;opacity:0.7;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:6px;color:#fca5a5;}
  .event{font-size:1.6rem;font-weight:900;margin-bottom:2px;}
  .college{opacity:0.6;font-size:0.88rem;margin-bottom:6px;}
  .ev-date{opacity:0.85;font-size:0.84rem;font-weight:700;margin-bottom:20px;color:#fca5a5;}
  .info-box{background:rgba(255,255,255,0.07);border-radius:14px;padding:16px 20px;margin-bottom:18px;border:1px solid rgba(255,255,255,0.1);}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;}
  .field-label{opacity:0.5;font-size:0.68rem;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:2px;}
  .field-val{font-weight:700;font-size:0.86rem;}
  .divider{border:none;border-top:2px dashed rgba(239,68,68,0.4);margin:16px 0;}
  .reason-box{background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.4);border-radius:12px;padding:14px 18px;margin-top:16px;}
  .reason-label{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:#fca5a5;font-weight:700;margin-bottom:6px;}
  .reason-text{font-size:0.9rem;font-weight:600;color:#fca5a5;line-height:1.5;}
  .footer{margin-top:14px;font-size:0.74rem;opacity:0.45;text-align:center;}
  .print-note{text-align:center;color:#8891a8;font-size:0.75rem;margin-top:20px;}
  @media print{body{background:#fff;padding:0;} .print-note{display:none;}}
</style></head><body>
<div>
  <div class="ticket">
    <div class="stamp">REJECTED</div>
    <div class="inner">
      <div class="badge">❌ Rejected Registration</div>
      <div class="event">${reg.eventName}</div>
      <div class="college">Your College CSE Department</div>
      ${evDateStr?`<div class="ev-date">📅 Event Date: ${evDateStr}</div>`:""}
      <div class="info-box">
        <div class="grid">
          ${[["Name",reg.userName],["College",reg.collegeName],["College ID",reg.collegeId],["Academic Year",reg.academicYear],["University",reg.universityName||"—"],["Email",reg.email],["WhatsApp",reg.whatsapp],["Transaction ID",reg.transactionId]].map(([k,v])=>`<div><div class="field-label">${k}</div><div class="field-val">${v||"—"}</div></div>`).join("")}
        </div>
      </div>
      <hr class="divider"/>
      <div class="reason-box">
        <div class="reason-label">🚫 Reason for Rejection</div>
        <div class="reason-text">${reg.rejReason||"No reason provided."}</div>
      </div>
      <div class="footer">Rejected on: ${fmtDateTime(reg.rejectedAt||Date.now())} · Submitted: ${fmtDateTime(reg.submittedAt)}</div>
    </div>
  </div>
  <div class="print-note">Print or save this as PDF using Ctrl+P / Cmd+P</div>
</div>
</body></html>`;
    const dataUri=`data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
    const a=document.createElement("a");
    a.href=dataUri;
    a.download=`REJECTED_${reg.eventName.replace(/[^a-zA-Z0-9]/g,"_")}_${reg.userName.replace(/\s/g,"_")}.html`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
  };

  const filteredRegs=filterEvent==="All"?registrations:registrations.filter(r=>r.eventId===filterEvent);
  const TabBtn=({k,label})=>(<button onClick={()=>setTab(k)} style={{...BS(tab===k?"var(--accent)":"transparent"),color:tab===k?"#fff":"var(--muted)",border:"1.5px solid "+(tab===k?"var(--accent)":"var(--border)"),padding:"9px 18px"}}>{label}</button>);

  // Ticket preview modal
  if(viewTicket) {
    const reg=registrations.find(r=>r.id===viewTicket);
    const ev=ticketEvents.find(e=>e.id===reg?.eventId);
    const evDateStr=ev?.eventDate?new Date(ev.eventDate+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):"";
    return (
      <div>
        <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
          <button onClick={()=>setViewTicket(null)} style={{...BS("transparent"),color:"var(--muted)",border:"1.5px solid var(--border)"}}>← Back</button>
          <button onClick={()=>downloadTicket(viewTicket)} style={{...BS("#10b981"),display:"flex",alignItems:"center",gap:6}}>⬇️ Download Ticket</button>
        </div>
        <div style={{maxWidth:520,margin:"0 auto"}}>
          <div style={{background:"linear-gradient(135deg,var(--accent) 0%,#7c3aed 100%)",borderRadius:20,padding:"28px",color:"#fff",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:-20,right:-20,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.08)"}}/>
            <div style={{position:"absolute",bottom:-30,left:-10,width:160,height:160,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
            <div style={{position:"relative",zIndex:1}}>
              <div style={{fontSize:"0.7rem",opacity:0.8,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:4}}>🎟 Event Ticket</div>
              <div style={{fontFamily:"var(--font-head)",fontSize:"1.6rem",fontWeight:900,marginBottom:2}}>{reg.eventName}</div>
              <div style={{opacity:0.75,fontSize:"0.85rem",marginBottom:evDateStr?8:20}}>Your College CSE Department</div>
              {evDateStr&&<div style={{opacity:0.9,fontSize:"0.83rem",fontWeight:700,marginBottom:20}}>📅 Event Date: {evDateStr}</div>}
              <div style={{background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"14px 18px",marginBottom:16}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 20px",fontSize:"0.83rem"}}>
                  {[["Name",reg.userName],["College",reg.collegeName],["College ID",reg.collegeId],["Academic Year",reg.academicYear],["University",reg.universityName||"—"],["Email",reg.email]].map(([k,v])=>(<div key={k}><div style={{opacity:0.6,fontSize:"0.68rem",textTransform:"uppercase",letterSpacing:"0.06em"}}>{k}</div><div style={{fontWeight:700,marginTop:1}}>{v}</div></div>))}
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"2px dashed rgba(255,255,255,0.3)",paddingTop:14}}>
                <div><div style={{opacity:0.7,fontSize:"0.7rem",textTransform:"uppercase"}}>Ticket No.</div><div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:"0.95rem",letterSpacing:"0.08em"}}>{reg.ticketNo}</div></div>
                <div style={{textAlign:"right"}}><div style={{opacity:0.7,fontSize:"0.7rem",textTransform:"uppercase"}}>Amount Paid</div><div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:"1.1rem"}}>₹{reg.amount}</div></div>
              </div>
              <div style={{marginTop:14,padding:"8px 14px",background:"rgba(255,255,255,0.15)",borderRadius:8,fontSize:"0.75rem",fontWeight:700}}>✅ APPROVED — {fmtDateTime(reg.approvedAt||Date.now())}</div>
              <div style={{marginTop:8,padding:"8px 14px",background:"rgba(239,68,68,0.25)",borderRadius:8,fontSize:"0.72rem",fontWeight:600}}>⚠️ Carry college ID proof compulsorily on the day of the event</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
        <TabBtn k="events" label="🎟️ Events"/>
        <TabBtn k="registrations" label="📋 Registrations"/>
        <TabBtn k="stats" label="📊 Statistics"/>
      </div>

      {tab==="events"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:"1rem"}}>Ticket Events</div>
            <button onClick={()=>setShowNew(v=>!v)} style={{...BS("var(--accent)"),display:"flex",alignItems:"center",gap:6}}>➕ New Event Ticket Sale</button>
          </div>
          {showNew&&(
            <div style={{background:"var(--card)",border:"2px dashed var(--accent)",borderRadius:14,padding:"20px",marginBottom:20}}>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800,marginBottom:14,color:"var(--accent)"}}>New Event</div>
              {[["eventName","Event Name *"],["amount","Amount (₹) *"],["seats","Seats Available *"],["offer","Offer / Discount (optional)"]].map(([k,lbl])=>(<div key={k} style={{marginBottom:10}}><label style={{fontSize:"0.8rem",fontWeight:700,display:"block",marginBottom:4}}>{lbl}</label><input value={newEv[k]} onChange={e=>setNewEv(p=>({...p,[k]:e.target.value}))} placeholder={lbl.replace(" *","")} style={IS}/></div>))}
              <div style={{marginBottom:10}}>
                <label style={{fontSize:"0.8rem",fontWeight:700,display:"block",marginBottom:4}}>📅 Event Date *</label>
                <input type="date" value={newEv.eventDate} onChange={e=>setNewEv(p=>({...p,eventDate:e.target.value}))} style={{...IS,cursor:"pointer"}}/>
              </div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:"0.8rem",fontWeight:700,display:"block",marginBottom:4}}>UPI QR Code Image *</label>
                <input type="file" accept="image/*" onChange={handleQrUpload} style={{...IS,cursor:"pointer"}}/>
                <div style={{fontSize:"0.75rem",opacity:0.5,marginTop:4}}>Upload directly from your device — no URL needed.</div>
                {newEv.qrPreview&&<div style={{marginTop:12,textAlign:"center"}}><div style={{fontSize:"0.75rem",opacity:0.55,marginBottom:6}}>Preview:</div><img src={newEv.qrPreview} alt="QR Preview" style={{width:150,height:150,borderRadius:10,border:"2px solid var(--accent)",objectFit:"contain",background:"#fff"}}/></div>}
              </div>
              <select value={newEv.status} onChange={e=>setNewEv(p=>({...p,status:e.target.value}))} style={{...IS,width:"auto",cursor:"pointer",marginBottom:14}}>
                <option value="live">🟢 Live</option><option value="upcoming">🟡 Upcoming</option><option value="closed">🔴 Closed</option>
              </select>
              <button onClick={createEvent} style={{...BS("var(--accent)"),width:"100%",padding:"12px"}}>Create Event</button>
            </div>
          )}
          {ticketEvents.length===0&&<p style={{opacity:0.4,fontSize:"0.88rem"}}>No events created yet.</p>}
          {ticketEvents.map(ev=>{
            const evRegs=registrations.filter(r=>r.eventId===ev.id);
            const approved=evRegs.filter(r=>r.status==="approved").length;
            const pending=evRegs.filter(r=>r.status==="pending").length;
            return (
              <div key={ev.id} style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:14,padding:"16px 20px",marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:8}}>
                  <div>
                    <div style={{fontFamily:"var(--font-head)",fontWeight:800}}>{ev.eventName}</div>
                    <div style={{fontSize:"0.82rem",opacity:0.6,marginTop:4}}>
                      {ev.eventDate&&<span style={{marginRight:12}}>📅 {new Date(ev.eventDate+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span>}
                      ₹{ev.amount} · {ev.seats} seats left (of {ev.seatsTotal||ev.seats}) · Status: <span style={{color:ev.status==="live"?"#10b981":ev.status==="upcoming"?"#f59e0b":"#ef4444",fontWeight:700}}>{ev.status}</span>{ev.offer&&` · ${ev.offer}`}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <div style={{fontSize:"0.78rem",opacity:0.6}}>✅{approved} ⏳{pending}</div>
                    <button onClick={()=>setTicketEvents(p=>p.map(e=>e.id===ev.id?{...e,status:e.status==="live"?"closed":"live"}:e))} style={{...BS(ev.status==="live"?"#ef4444":"#10b981"),padding:"7px 14px",fontSize:"0.8rem"}}>{ev.status==="live"?"Close":"Reopen"}</button>
                    {delEvId===ev.id?(
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <span style={{fontSize:"0.75rem",color:"#ef4444",fontWeight:700,whiteSpace:"nowrap"}}>Delete all data?</span>
                        <button onClick={()=>deleteEvent(ev.id)} style={{...BS("#ef4444"),padding:"6px 12px",fontSize:"0.8rem"}}>Yes, Delete</button>
                        <button onClick={()=>setDelEvId(null)} style={{...BS("transparent"),color:"var(--muted)",border:"1.5px solid var(--border)",padding:"6px 10px",fontSize:"0.8rem"}}>Cancel</button>
                      </div>
                    ):(
                      <button onClick={()=>setDelEvId(ev.id)} style={{...BS("transparent"),color:"#ef4444",border:"1.5px solid #ef444433",padding:"7px 12px",fontSize:"0.8rem"}}>🗑️ Delete</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab==="registrations"&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
            <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:"1rem"}}>All Registrations ({filteredRegs.length})</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              <select value={filterEvent} onChange={e=>setFilterEvent(e.target.value)} style={{...IS,width:"auto",cursor:"pointer",fontSize:"0.82rem"}}>
                <option value="All">All Events</option>
                {ticketEvents.map(ev=><option key={ev.id} value={ev.id}>{ev.eventName}</option>)}
              </select>
            </div>
          </div>
          {filteredRegs.length===0&&<p style={{opacity:0.4,fontSize:"0.88rem"}}>No registrations yet.</p>}
          {filteredRegs.map(r=>(
            <div key={r.id} style={{background:"var(--card)",border:`1.5px solid ${r.status==="approved"?"#10b981":r.status==="rejected"?"#ef4444":"var(--border)"}`,borderRadius:14,padding:"16px 20px",marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8,marginBottom:10}}>
                <div>
                  <div style={{fontFamily:"var(--font-head)",fontWeight:800}}>{r.userName}</div>
                  <div style={{fontSize:"0.78rem",opacity:0.55}}>{r.eventName} · {r.collegeName} · ID: {r.collegeId} · {r.academicYear}</div>
                  <div style={{fontSize:"0.78rem",opacity:0.55}}>{r.email} · WA: {r.whatsapp}</div>
                  <div style={{fontSize:"0.78rem",opacity:0.55}}>Txn: {r.transactionId} · Submitted: {fmtDateTime(r.submittedAt)}</div>
                  {r.status==="approved"&&<div style={{fontSize:"0.78rem",color:"var(--accent2)",marginTop:4}}>🎟 {r.ticketNo}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                  <span style={{background:r.status==="approved"?"#10b981":r.status==="rejected"?"#ef4444":"#f59e0b",color:"#fff",fontSize:"0.7rem",fontWeight:800,padding:"4px 12px",borderRadius:20,textTransform:"uppercase"}}>{r.status}</span>
                  {r.screenshot&&<div style={{fontSize:"0.72rem",opacity:0.5}}>📎 Screenshot uploaded</div>}
                </div>
              </div>
              {r.screenshot&&<img src={r.screenshot} alt="Payment proof" style={{maxWidth:"100%",maxHeight:200,borderRadius:10,marginBottom:10,border:"1px solid var(--border)",objectFit:"contain"}}/>}
              {r.status==="pending"&&(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>approve(r.id)} style={{...BS("#10b981"),flex:1,padding:"9px"}}>✅ Approve & Send Ticket</button>
                    <button onClick={()=>setSelReg(selReg===r.id?null:r.id)} style={{...BS("#ef4444"),flex:1,padding:"9px"}}>❌ Reject</button>
                  </div>
                  {selReg===r.id&&(<div style={{display:"flex",gap:8}}><input value={rejReasons[r.id]||""} onChange={e=>setRejReasons(p=>({...p,[r.id]:e.target.value}))} placeholder="Reason for rejection (will be sent to user)..." style={IS}/><button onClick={()=>reject(r.id)} style={{...BS("#ef4444"),flexShrink:0}}>Send</button></div>)}
                </div>
              )}
              {r.status==="approved"&&(
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <div style={{flex:1,fontSize:"0.78rem",color:"#10b981"}}>✅ Approved — Confirmation sent to email & WhatsApp <span style={{opacity:0.6}}>(requires backend integration)</span></div>
                  <button onClick={()=>setViewTicket(r.id)} style={{...BS("var(--accent)"),padding:"6px 14px",fontSize:"0.78rem",flexShrink:0}}>🎟 View Ticket</button>
                  <button onClick={()=>downloadTicket(r.id)} style={{...BS("#10b981"),padding:"6px 14px",fontSize:"0.78rem",flexShrink:0}}>⬇️ Download</button>
                </div>
              )}
              {r.status==="rejected"&&(
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                  <div style={{fontSize:"0.78rem",color:"#ef4444",flex:1}}>❌ Rejected: {r.rejReason} — Rejection notification sent <span style={{opacity:0.6}}>(requires backend integration)</span></div>
                  <button onClick={()=>downloadRejectedTicket(r.id)} style={{...BS("transparent"),color:"#ef4444",border:"1.5px solid #ef444444",padding:"6px 14px",fontSize:"0.78rem",flexShrink:0}}>⬇️ Download Rejection</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab==="stats"&&(
        <div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:"1rem",marginBottom:16}}>📁 Statistics Folder</div>
          {ticketEvents.length===0&&<p style={{opacity:0.4,fontSize:"0.88rem"}}>No events yet.</p>}
          {ticketEvents.map(ev=>{
            const evRegs=registrations.filter(r=>r.eventId===ev.id);
            const approved=evRegs.filter(r=>r.status==="approved").length;
            const pending=evRegs.filter(r=>r.status==="pending").length;
            const rejected=evRegs.filter(r=>r.status==="rejected").length;
            const revenue=approved*Number(ev.amount);
            return (
              <div key={ev.id} style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:14,padding:"20px",marginBottom:14}}>
                <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:"1rem",marginBottom:12}}>📁 {ev.eventName}</div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
                  {[{label:"Approved",val:approved,color:"#10b981"},{label:"Pending",val:pending,color:"#f59e0b"},{label:"Rejected",val:rejected,color:"#ef4444"},{label:"Revenue",val:`₹${revenue}`,color:"#a78bfa"},{label:"Seats Left",val:ev.seats,color:"#3b82f6"}].map(s=>(
                    <div key={s.label} style={{background:`${s.color}15`,border:`1px solid ${s.color}44`,borderRadius:10,padding:"10px 18px",textAlign:"center",flex:"1 1 100px"}}>
                      <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:"1.3rem",color:s.color}}>{s.val}</div>
                      <div style={{fontSize:"0.72rem",opacity:0.6}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {evRegs.length>0&&(
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.78rem"}}>
                      <thead>
                        <tr style={{borderBottom:"2px solid var(--border)"}}>
                          {["#","Ticket No","Name","College","ID","University","Yr","Email","WA","Txn ID","Status","Date"].map(h=>(
                            <th key={h} style={{padding:"8px 10px",textAlign:"left",fontFamily:"var(--font-head)",opacity:0.6,whiteSpace:"nowrap"}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {evRegs.map((r,i)=>(
                          <tr key={r.id} style={{borderBottom:"1px solid var(--border)"}}>
                            {[i+1,r.ticketNo||"—",r.userName,r.collegeName,r.collegeId,r.universityName||"—",r.academicYear,r.email,r.whatsapp,r.transactionId,r.status,fmtDate(r.submittedAt)].map((v,j)=>(
                              <td key={j} style={{padding:"8px 10px",whiteSpace:"nowrap",color:v==="approved"?"#10b981":v==="rejected"?"#ef4444":"var(--text)"}}>{v}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  ADMIN RESOURCES
// ════════════════════════════════════════════════════════
const BASE_SECTION_KEYS=[{key:"syllabus",label:"Syllabus",icon:"📘"},{key:"calendar",label:"Academic Calendar",icon:"📅"},{key:"pyq",label:"Previous Year Questions",icon:"📝"},{key:"notes",label:"Notes",icon:"📚"},{key:"timetable",label:"Lectures Time Table",icon:"⏱️"}];
const getSectionKeys=(year)=>{
  const [s1,s2]=year===1?["Sem I","Sem II"]:year===2?["Sem III","Sem IV"]:year===3?["Sem V","Sem VI"]:["Sem VII","Sem VIII"];
  return [...BASE_SECTION_KEYS,{key:"examMid1",label:`Exam – ${s1} Mid Term`,icon:"📋"},{key:"examEnd1",label:`Exam – ${s1} End Term`,icon:"📋"},{key:"examMid2",label:`Exam – ${s2} Mid Term`,icon:"📋"},{key:"examEnd2",label:`Exam – ${s2} End Term`,icon:"📋"}];
};

function AdminResources({resources,setResources}) {
  const [activeYear,setActiveYear]=useState(1);
  const [activeStream,setActiveStream]=useState(null);
  const [activeSection,setActiveSection]=useState("syllabus");
  const [saved,setSaved]=useState(false);
  const getSection=()=>{if(activeYear<=2)return resources[activeYear][activeSection];return activeStream?resources[activeYear][activeStream][activeSection]:null;};
  const setSection=updated=>{if(activeYear<=2){setResources(p=>({...p,[activeYear]:{...p[activeYear],[activeSection]:updated}}));}else if(activeStream){setResources(p=>({...p,[activeYear]:{...p[activeYear],[activeStream]:{...p[activeYear][activeStream],[activeSection]:updated}}}));}};
  const save=()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);};
  const SECTION_KEYS=getSectionKeys(activeYear);
  return (
    <div style={{display:"flex",gap:0,minHeight:600,background:"var(--bg)",borderRadius:18,border:"1.5px solid var(--border)",overflow:"hidden"}}>
      <div style={{width:220,flexShrink:0,background:"var(--card)",borderRight:"1.5px solid var(--border)",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px 12px 10px",fontFamily:"var(--font-head)",fontWeight:900,fontSize:"0.82rem",color:"var(--accent)",letterSpacing:"0.05em"}}>📚 RESOURCES</div>
        <div style={{padding:"0 10px 10px",display:"flex",gap:5,flexWrap:"wrap"}}>
          {[1,2,3,4].map(y=>(<button key={y} onClick={()=>{setActiveYear(y);setActiveStream(null);setActiveSection("syllabus");}} style={{flex:"1 1 40px",padding:"6px 4px",background:activeYear===y?"var(--accent)":"transparent",color:activeYear===y?"#fff":"var(--muted)",border:"1.5px solid "+(activeYear===y?"var(--accent)":"var(--border)"),borderRadius:8,cursor:"pointer",fontFamily:"var(--font-head)",fontWeight:800,fontSize:"0.75rem"}}>Yr {y}</button>))}
        </div>
        {activeYear>=3&&(<div style={{padding:"0 8px 10px",borderBottom:"1px solid var(--border)",maxHeight:180,overflowY:"auto"}}><div style={{fontSize:"0.7rem",opacity:0.45,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",padding:"4px 4px 6px"}}>Stream</div>{STREAMS_34.map(s=>(<button key={s} onClick={()=>setActiveStream(v=>v===s?null:s)} style={{width:"100%",textAlign:"left",padding:"8px 10px",background:activeStream===s?"rgba(99,102,241,0.15)":"transparent",border:"none",borderLeft:`3px solid ${activeStream===s?"var(--accent)":"transparent"}`,cursor:"pointer",color:activeStream===s?"var(--text)":"var(--muted)",fontFamily:"var(--font-body)",fontSize:"0.8rem",fontWeight:activeStream===s?700:400}}>{s}</button>))}</div>)}
        <div style={{flex:1,overflowY:"auto"}}>
          {SECTION_KEYS.map(s=>(<button key={s.key} onClick={()=>setActiveSection(s.key)} style={{width:"100%",textAlign:"left",padding:"10px 14px",background:activeSection===s.key?"rgba(99,102,241,0.15)":"transparent",border:"none",borderLeft:`3px solid ${activeSection===s.key?"var(--accent)":"transparent"}`,cursor:"pointer",color:activeSection===s.key?"var(--text)":"var(--muted)",fontFamily:"var(--font-body)",fontSize:"0.8rem",fontWeight:activeSection===s.key?700:400,display:"flex",gap:7,alignItems:"center"}}>{s.icon} {s.label}</button>))}
        </div>
      </div>
      <div style={{flex:1,padding:"22px",overflowY:"auto"}}>
        {(activeYear<=2||activeStream)?(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
              <div><div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:"1rem"}}>{SECTION_KEYS.find(s=>s.key===activeSection)?.icon} Year {activeYear}{activeStream?` → ${activeStream}`:""} → {SECTION_KEYS.find(s=>s.key===activeSection)?.label}</div><div style={{fontSize:"0.75rem",opacity:0.4,marginTop:2}}>Blank slots are hidden on student view.</div></div>
              <button onClick={save} style={{...BS(saved?"#10b981":"var(--accent)"),padding:"9px 20px"}}>{saved?"✅ Saved!":"💾 Save"}</button>
            </div>
            <div style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:14,padding:"18px",marginBottom:18}}>{getSection()&&<ResourceEditor section={getSection()} onChange={setSection}/>}</div>
            <div style={{fontSize:"0.75rem",opacity:0.45,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10,fontFamily:"var(--font-head)"}}>👁 Live Preview</div>
            <div style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:14,padding:"16px"}}>{getSection()&&<ResourceViewer section={getSection()}/>}</div>
          </>
        ):(
          <div style={{textAlign:"center",padding:"60px 20px",opacity:0.4}}><div style={{fontSize:"2.5rem",marginBottom:10}}>👈</div><div style={{fontFamily:"var(--font-head)",fontWeight:700}}>Select a stream from the sidebar to edit resources</div></div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  ADMIN FACULTY
// ════════════════════════════════════════════════════════
function AdminFaculty({faculty,setFaculty}) {
  const [search,setSearch]=useState("");
  const [editId,setEditId]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({name:"",dept:"",cabin:""});
  const [delId,setDelId]=useState(null);
  const filtered=faculty.filter(f=>fuzzyMatch(f.name,search)||fuzzyMatch(f.dept,search)||search==="");
  const add=()=>{if(!form.name||!form.dept){alert("Name and department required.");return;}setFaculty(p=>[...p,{...form,id:Date.now()}]);setForm({name:"",dept:"",cabin:""});setShowAdd(false);};
  const save=(id)=>{setFaculty(p=>p.map(f=>f.id===id?{...f,...form}:f));setEditId(null);};
  const del=(id)=>{setFaculty(p=>p.filter(f=>f.id!==id));setDelId(null);};
  const startEdit=(f)=>{setForm({name:f.name,dept:f.dept,cabin:f.cabin});setEditId(f.id);setShowAdd(false);};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:"1rem"}}>👨‍🏫 Faculty Management ({faculty.length})</div>
        <button onClick={()=>{setShowAdd(v=>!v);setEditId(null);setForm({name:"",dept:"",cabin:""});}} style={{...BS("var(--accent)"),display:"flex",alignItems:"center",gap:6}}>➕ Add Faculty</button>
      </div>
      {showAdd&&(<div style={{background:"var(--card)",border:"2px dashed var(--accent)",borderRadius:14,padding:"18px",marginBottom:18}}><div style={{fontFamily:"var(--font-head)",fontWeight:800,marginBottom:12,color:"var(--accent)"}}>Add New Faculty</div>{[["name","Full Name *"],["dept","Department / Subject *"],["cabin","Cabin Location"]].map(([k,lbl])=>(<div key={k} style={{marginBottom:10}}><label style={{fontSize:"0.8rem",fontWeight:700,display:"block",marginBottom:4}}>{lbl}</label><input value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} placeholder={lbl.replace(" *","")} style={IS}/></div>))}<div style={{display:"flex",gap:8}}><button onClick={add} style={{...BS("var(--accent)"),flex:1,padding:"10px"}}>Add</button><button onClick={()=>setShowAdd(false)} style={{...BS("transparent"),color:"var(--muted)",border:"1.5px solid var(--border)"}}>Cancel</button></div></div>)}
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or department..." style={{...IS,marginBottom:14,padding:"11px 14px"}}/>
      <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:500,overflowY:"auto"}}>
        {filtered.map(f=>(
          <div key={f.id} style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:12,padding:"14px 16px"}}>
            {editId===f.id?(
              <div>{[["name","Name"],["dept","Department"],["cabin","Cabin"]].map(([k,lbl])=>(<div key={k} style={{marginBottom:8}}><label style={{fontSize:"0.78rem",fontWeight:700,display:"block",marginBottom:3}}>{lbl}</label><input value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={{...IS,fontSize:"0.85rem"}}/></div>))}<div style={{display:"flex",gap:8,marginTop:6}}><button onClick={()=>save(f.id)} style={{...BS("var(--accent)"),padding:"8px 18px",fontSize:"0.85rem"}}>Save</button><button onClick={()=>setEditId(null)} style={{...BS("transparent"),color:"var(--muted)",border:"1.5px solid var(--border)",padding:"8px 14px",fontSize:"0.85rem"}}>Cancel</button></div></div>
            ):(
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}><div><div style={{fontWeight:700,fontFamily:"var(--font-head)",fontSize:"0.92rem"}}>{f.name}</div><div style={{fontSize:"0.77rem",opacity:0.55}}>{f.dept}</div><div style={{fontSize:"0.77rem",opacity:0.45,marginTop:2}}>📍 {f.cabin||"Pending"}</div></div><div style={{display:"flex",gap:6}}><button onClick={()=>startEdit(f)} style={{...BS("transparent"),color:"#10b981",border:"1.5px solid #10b98133",padding:"6px 12px",fontSize:"0.8rem"}}>✏️ Edit</button>{delId===f.id?(<div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:"0.75rem",color:"#ef4444",fontWeight:700}}>Delete?</span><button onClick={()=>del(f.id)} style={{...BS("#ef4444"),padding:"6px 12px",fontSize:"0.8rem",borderRadius:8}}>Yes</button><button onClick={()=>setDelId(null)} style={{...BS("transparent"),color:"var(--muted)",border:"1.5px solid var(--border)",padding:"6px 10px",fontSize:"0.8rem",borderRadius:8}}>No</button></div>):<button onClick={()=>setDelId(f.id)} style={{...BS("transparent"),color:"#ef4444",border:"1.5px solid #ef444433",padding:"6px 12px",fontSize:"0.8rem"}}>🗑️ Delete</button>}</div></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  CHANGE PASSWORD COMPONENT
// ════════════════════════════════════════════════════════
function ChangePasswordForm({onSave,onCancel,isFirstTime,currentLabel}) {
  const [cur,setCur]=useState("");
  const [n,setN]=useState("");
  const [c,setC]=useState("");
  const [err,setErr]=useState("");
  const submit=()=>{
    if(!isFirstTime&&!cur){setErr("Enter current password.");return;}
    if(n.length<8){setErr("New password must be at least 8 characters.");return;}
    if(n!==c){setErr("Passwords don't match.");return;}
    onSave(isFirstTime?null:cur,n);
  };
  return (
    <div style={{background:"var(--card)",border:"2px dashed var(--accent)",borderRadius:14,padding:"22px",maxWidth:420}}>
      <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:"1rem",marginBottom:4,color:"var(--accent)"}}>🔑 {isFirstTime?"Set New Password":"Change Password"}</div>
      {isFirstTime&&<div style={{fontSize:"0.82rem",background:"rgba(245,158,11,0.12)",color:"#f59e0b",borderRadius:8,padding:"8px 12px",marginBottom:14,lineHeight:1.5}}>⚠ First login detected. You must set a new password before proceeding.</div>}
      {currentLabel&&<div style={{fontSize:"0.78rem",opacity:0.5,marginBottom:12}}>Changing password for: <b>{currentLabel}</b></div>}
      {!isFirstTime&&<div style={{marginBottom:10}}><label style={{fontSize:"0.82rem",fontWeight:700,display:"block",marginBottom:4}}>Current Password</label><input type="password" value={cur} onChange={e=>{setCur(e.target.value);setErr("");}} style={IS}/></div>}
      <div style={{marginBottom:10}}><label style={{fontSize:"0.82rem",fontWeight:700,display:"block",marginBottom:4}}>New Password (min 8 chars)</label><input type="password" value={n} onChange={e=>{setN(e.target.value);setErr("");}} style={IS}/></div>
      <div style={{marginBottom:14}}><label style={{fontSize:"0.82rem",fontWeight:700,display:"block",marginBottom:4}}>Confirm New Password</label><input type="password" value={c} onChange={e=>{setC(e.target.value);setErr("");}} style={IS}/></div>
      {err&&<div style={{color:"#ef4444",fontSize:"0.82rem",marginBottom:10}}>{err}</div>}
      <div style={{display:"flex",gap:8}}><button onClick={submit} style={{...BS("var(--accent)"),flex:1,padding:"10px"}}>💾 Save Password</button>{onCancel&&<button onClick={onCancel} style={{...BS("transparent"),color:"var(--muted)",border:"1.5px solid var(--border)"}}>Cancel</button>}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  OWNER — MEMBER MANAGEMENT
// ════════════════════════════════════════════════════════
function MemberManagement({creds,setCreds}) {
  const [nickEdit,setNickEdit]=useState({});
  const [resetMsg,setResetMsg]=useState({});
  const [showPw,setShowPw]=useState({});

  const saveNick=(id,nick)=>{
    setCreds(p=>({...p,members:p.members.map(m=>m.id===id?{...m,nickname:nick}:m)}));
    setNickEdit(p=>({...p,[id]:false}));
  };
  const resetPassword=(id)=>{
    const newPw=randomPassword();
    setCreds(p=>({...p,members:p.members.map(m=>m.id===id?{...m,password:newPw,mustChangePassword:true}:m)}));
    setResetMsg(p=>({...p,[id]:newPw}));
  };

  return (
    <div>
      <div style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:"1rem",marginBottom:6}}>👥 Team Member Management</div>
      <div style={{fontSize:"0.82rem",opacity:0.5,marginBottom:20}}>Only you (Owner) can see this section. Set nicknames and reset member passwords.</div>
      {creds.members.map(m=>(
        <div key={m.id} style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:14,padding:"16px 20px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:10}}>
            <div>
              <div style={{fontFamily:"var(--font-head)",fontWeight:800}}>{m.nickname||m.username} <span style={{opacity:0.4,fontSize:"0.8rem",fontWeight:400}}>({m.username})</span></div>
              <div style={{fontSize:"0.78rem",marginTop:4,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{opacity:0.5}}>Password:</span>
                <span style={{fontFamily:"monospace",background:"rgba(99,102,241,0.1)",padding:"2px 8px",borderRadius:6,cursor:"pointer"}} onClick={()=>setShowPw(p=>({...p,[m.id]:!p[m.id]}))}>{showPw[m.id]?m.password:"••••••••"} {showPw[m.id]?"🙈":"👁"}</span>
                {m.mustChangePassword&&<span style={{background:"rgba(245,158,11,0.15)",color:"#f59e0b",fontSize:"0.7rem",padding:"2px 8px",borderRadius:20,fontWeight:700}}>Must Change PW</span>}
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <button onClick={()=>setNickEdit(p=>({...p,[m.id]:!p[m.id]}))} style={{...BS("transparent"),color:"#a78bfa",border:"1.5px solid #a78bfa33",padding:"6px 12px",fontSize:"0.8rem"}}>✏️ Nickname</button>
              <button onClick={()=>resetPassword(m.id)} style={{...BS("transparent"),color:"#f59e0b",border:"1.5px solid #f59e0b44",padding:"6px 12px",fontSize:"0.8rem"}}>🔄 Reset PW</button>
            </div>
          </div>
          {nickEdit[m.id]&&(
            <div style={{display:"flex",gap:8,marginTop:6}}>
              <input defaultValue={m.nickname} id={`nick-${m.id}`} placeholder="Enter nickname..." style={{...IS,flex:1,fontSize:"0.85rem"}}/>
              <button onClick={()=>saveNick(m.id,document.getElementById(`nick-${m.id}`).value)} style={{...BS("var(--accent)"),padding:"7px 14px",flexShrink:0}}>Save</button>
              <button onClick={()=>setNickEdit(p=>({...p,[m.id]:false}))} style={{...BS("transparent"),color:"var(--muted)",border:"1.5px solid var(--border)",padding:"7px 12px"}}>✕</button>
            </div>
          )}
          {resetMsg[m.id]&&(
            <div style={{marginTop:8,background:"rgba(16,185,129,0.1)",border:"1px solid #10b98144",borderRadius:8,padding:"8px 12px",fontSize:"0.82rem"}}>
              ✅ New password set: <span style={{fontFamily:"monospace",fontWeight:700,color:"#10b981"}}>{resetMsg[m.id]}</span> — Share this with the member privately.
            </div>
          )}
        </div>
      ))}
      <div style={{marginTop:20,padding:"16px",background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:12}}>
        <div style={{fontSize:"0.8rem",fontWeight:700,marginBottom:6,color:"var(--accent2)"}}>ℹ Owner Credentials Reminder</div>
        <div style={{fontSize:"0.78rem",opacity:0.6}}>Username: <b>{creds.owner.username}</b> — Change your password in Settings tab.</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  DOWNLOAD CREDENTIALS (Owner Only)
// ════════════════════════════════════════════════════════
function DownloadCredentials({creds}) {
  const [format,setFormat]=useState("txt");
  const [showPasswords,setShowPasswords]=useState(false);
  const [copyMsg,setCopyMsg]=useState("");
  const [downloadMsg,setDownloadMsg]=useState("");

  const buildTxt=()=>{
    return `CSE Portal — Admin Credentials\nGenerated: ${new Date().toLocaleString("en-IN")}\n${"─".repeat(42)}\n\n👑 OWNER\n  Username : ${creds.owner.username}\n  Password : ${creds.owner.password}\n\n${"─".repeat(42)}\n\n👥 TEAM MEMBERS\n\n${creds.members.map((m,i)=>`  Member ${i+1}: ${m.username}${m.nickname?` (${m.nickname})`:""}\n  Password : ${m.password}\n  Status   : ${m.mustChangePassword?"Must change password on next login":"Password set"}`).join("\n\n")}\n\n${"─".repeat(42)}\n⚠  Keep this file private. Do not share.`;
  };

  const buildCsv=()=>{
    const header="Role,Username,Nickname,Password,Must Change Password";
    const ownerRow=`Owner,${creds.owner.username},${creds.owner.nickname||""},${creds.owner.password},No`;
    const memberRows=creds.members.map(m=>`Member,${m.username},${m.nickname||""},${m.password},${m.mustChangePassword?"Yes":"No"}`);
    return [header,ownerRow,...memberRows].join("\n");
  };

  const getContent=()=>format==="csv"?buildCsv():buildTxt();

  const download=()=>{
    try {
      const content=getContent();
      const mime=format==="csv"?"text/csv":"text/plain";
      const ext=format==="csv"?"csv":"txt";
      const dataUri=`data:${mime};charset=utf-8,${encodeURIComponent(content)}`;
      const a=document.createElement("a");
      a.href=dataUri;
      a.download=`cse_portal_credentials.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadMsg("✅ Downloaded!");setTimeout(()=>setDownloadMsg(""),2500);
    } catch(e) {
      setDownloadMsg("❌ Download failed — use Copy instead");setTimeout(()=>setDownloadMsg(""),3500);
    }
  };

  const copy=()=>{
    navigator.clipboard.writeText(getContent()).then(()=>{
      setCopyMsg("✅ Copied!");setTimeout(()=>setCopyMsg(""),2000);
    }).catch(()=>{setCopyMsg("❌ Copy failed");setTimeout(()=>setCopyMsg(""),2000);});
  };

  return (
    <div>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:"1.1rem",marginBottom:4}}>⬇️ Download Credentials</div>
        <div style={{fontSize:"0.82rem",opacity:0.5,lineHeight:1.6}}>Export all admin login credentials (Owner + Team Members) as a file. Only visible to the Owner.</div>
      </div>

      {/* Warning banner */}
      <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.35)",borderRadius:12,padding:"12px 16px",marginBottom:22,display:"flex",gap:10,alignItems:"flex-start"}}>
        <span style={{fontSize:"1.1rem",flexShrink:0}}>⚠️</span>
        <div style={{fontSize:"0.82rem",color:"#fca5a5",lineHeight:1.6}}>This file contains <b>plain-text passwords</b>. Store it securely and never share it publicly. Delete after use if possible.</div>
      </div>

      {/* Format selector */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:"0.78rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",opacity:0.5,marginBottom:10}}>Export Format</div>
        <div style={{display:"flex",gap:10}}>
          {[{val:"txt",icon:"📄",label:"Plain Text (.txt)"},{val:"csv",icon:"📊",label:"Spreadsheet (.csv)"}].map(f=>(
            <button key={f.val} onClick={()=>setFormat(f.val)} style={{...BS(format===f.val?"var(--accent)":"var(--card)"),color:format===f.val?"#fff":"var(--muted)",border:`1.5px solid ${format===f.val?"var(--accent)":"var(--border)"}`,padding:"10px 18px",borderRadius:12,fontSize:"0.85rem",flex:"1 1 140px"}}>
              {f.icon} {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Credentials preview */}
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:"0.78rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",opacity:0.5}}>Preview</div>
          <button onClick={()=>setShowPasswords(v=>!v)} style={{...BS("transparent"),color:"var(--accent2)",border:"1.5px solid rgba(167,139,250,0.3)",padding:"5px 12px",fontSize:"0.78rem",borderRadius:8}}>
            {showPasswords?"🙈 Hide Passwords":"👁 Reveal Passwords"}
          </button>
        </div>

        {/* Owner card */}
        <div style={{background:"rgba(99,102,241,0.08)",border:"1.5px solid rgba(99,102,241,0.25)",borderRadius:14,padding:"16px 20px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <span style={{fontSize:"1.2rem"}}>👑</span>
            <span style={{fontFamily:"var(--font-head)",fontWeight:800,fontSize:"0.95rem",color:"var(--accent2)"}}>Owner</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"max-content 1fr",gap:"6px 16px",fontSize:"0.83rem"}}>
            <span style={{opacity:0.5,fontWeight:600}}>Username</span>
            <span style={{fontFamily:"monospace",fontWeight:700}}>{creds.owner.username}</span>
            <span style={{opacity:0.5,fontWeight:600}}>Password</span>
            <span style={{fontFamily:"monospace",fontWeight:700,color:"var(--accent2)"}}>
              {showPasswords?creds.owner.password:"••••••••••"}
            </span>
            {creds.owner.nickname&&<><span style={{opacity:0.5,fontWeight:600}}>Nickname</span><span>{creds.owner.nickname}</span></>}
          </div>
        </div>

        {/* Member cards */}
        {creds.members.map((m,i)=>(
          <div key={m.id} style={{background:"rgba(16,185,129,0.06)",border:"1.5px solid rgba(16,185,129,0.2)",borderRadius:14,padding:"14px 20px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:"1rem"}}>👤</span>
              <span style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:"0.88rem"}}>Member {i+1} {m.nickname?`— ${m.nickname}`:""}</span>
              {m.mustChangePassword&&<span style={{background:"rgba(245,158,11,0.15)",color:"#f59e0b",fontSize:"0.68rem",padding:"2px 8px",borderRadius:20,fontWeight:700}}>Must Change PW</span>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"max-content 1fr",gap:"6px 16px",fontSize:"0.82rem"}}>
              <span style={{opacity:0.5,fontWeight:600}}>Username</span>
              <span style={{fontFamily:"monospace",fontWeight:700}}>{m.username}</span>
              <span style={{opacity:0.5,fontWeight:600}}>Password</span>
              <span style={{fontFamily:"monospace",fontWeight:700,color:"#6ee7b7"}}>
                {showPasswords?m.password:"••••••••••"}
              </span>
              <span style={{opacity:0.5,fontWeight:600}}>Status</span>
              <span style={{opacity:0.75}}>{m.mustChangePassword?"Must change on login":"Active"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <button onClick={download} style={{...BS("var(--accent)"),padding:"12px 28px",fontSize:"0.9rem",borderRadius:12,display:"flex",alignItems:"center",gap:8,flex:"1 1 180px",justifyContent:"center"}}>
          ⬇️ {downloadMsg||`Download .${format.toUpperCase()}`}
        </button>
        <button onClick={copy} style={{...BS("transparent"),color:"var(--accent2)",border:"1.5px solid rgba(167,139,250,0.4)",padding:"12px 24px",fontSize:"0.9rem",borderRadius:12,display:"flex",alignItems:"center",gap:8,flex:"1 1 140px",justifyContent:"center"}}>
          📋 {copyMsg||"Copy to Clipboard"}
        </button>
      </div>

      {/* Footer note */}
      <div style={{marginTop:20,padding:"12px 16px",background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.18)",borderRadius:10,fontSize:"0.78rem",opacity:0.65,lineHeight:1.6}}>
        💡 <b>Tip:</b> After resetting a member password in the Team Members tab, re-download credentials here to keep your backup up to date.
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  ADMIN DASHBOARD SHELL
// ════════════════════════════════════════════════════════
function AdminDashboard({resources,setResources,faculty,setFaculty,ticketEvents,setTicketEvents,registrations,setRegistrations,creds,setCreds,adminRole,onLogout}) {
  const [tab,setTab]=useState("resources");
  const [changePwOpen,setChangePwOpen]=useState(false);
  const [credSaved,setCredSaved]=useState(false);
  const isOwner=adminRole==="owner";
  const loggedMember=adminRole!=="owner"?creds.members.find(m=>m.id===adminRole):null;
  const displayName=isOwner?(creds.owner.nickname||creds.owner.username):(loggedMember?.nickname||loggedMember?.username||"Admin");

  const saveOwnerPw=(_,newPw)=>{
    setCreds(p=>({...p,owner:{...p.owner,password:newPw}}));
    setChangePwOpen(false);setCredSaved(true);setTimeout(()=>setCredSaved(false),2000);
  };
  const saveMemberPw=(oldPw,newPw)=>{
    if(oldPw!==null&&loggedMember&&oldPw!==loggedMember.password){alert("Current password is incorrect.");return;}
    setCreds(p=>({...p,members:p.members.map(m=>m.id===adminRole?{...m,password:newPw,mustChangePassword:false}:m)}));
    setChangePwOpen(false);setCredSaved(true);setTimeout(()=>setCredSaved(false),2000);
  };

  const TabBtn=({k,icon,label,ownerOnly})=>{
    if(ownerOnly&&!isOwner)return null;
    return <button onClick={()=>setTab(k)} style={{...BS(tab===k?"var(--accent)":"var(--card)"),color:tab===k?"#fff":"var(--muted)",border:`1.5px solid ${tab===k?"var(--accent)":"var(--border)"}`,padding:"10px 18px",display:"flex",alignItems:"center",gap:6,fontSize:"0.88rem"}}>{icon} {label}</button>;
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:"1.5rem"}}>🛠 Admin Dashboard</div>
          <div style={{fontSize:"0.8rem",opacity:0.4,marginTop:2}}>Logged in as <b style={{color:"var(--accent2)"}}>{displayName}</b> {isOwner?"(Owner)":"(Team Member)"}</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {credSaved&&<span style={{color:"#10b981",fontSize:"0.82rem",fontWeight:700,alignSelf:"center"}}>✅ Saved!</span>}
          <button onClick={()=>setChangePwOpen(v=>!v)} style={{...BS("transparent"),color:"var(--muted)",border:"1.5px solid var(--border)",padding:"8px 14px",fontSize:"0.8rem"}}>🔑 Change PW</button>
          <button onClick={onLogout} style={{...BS("#ef4444"),padding:"8px 14px",fontSize:"0.8rem"}}>Logout</button>
        </div>
      </div>
      {changePwOpen&&(
        <div style={{marginBottom:24}}>
          <ChangePasswordForm onSave={isOwner?saveOwnerPw:saveMemberPw} onCancel={()=>setChangePwOpen(false)} isFirstTime={false} currentLabel={isOwner?creds.owner.username:loggedMember?.username}/>
        </div>
      )}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:28}}>
        <TabBtn k="resources" icon="📚" label="Resources"/>
        <TabBtn k="faculty" icon="👨‍🏫" label="Faculty"/>
        <TabBtn k="tickets" icon="🎟️" label="Ticket Portal"/>
        <TabBtn k="members" icon="👥" label="Team Members" ownerOnly/>
        <TabBtn k="downloadcreds" icon="⬇️" label="Download Creds" ownerOnly/>
      </div>
      {tab==="resources"&&<AdminResources resources={resources} setResources={setResources}/>}
      {tab==="faculty"&&<AdminFaculty faculty={faculty} setFaculty={setFaculty}/>}
      {tab==="tickets"&&<TicketAdminPortal ticketEvents={ticketEvents} setTicketEvents={setTicketEvents} registrations={registrations} setRegistrations={setRegistrations}/>}
      {tab==="members"&&isOwner&&<MemberManagement creds={creds} setCreds={setCreds}/>}
      {tab==="downloadcreds"&&isOwner&&<DownloadCredentials creds={creds}/>}
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  ADMIN LOGIN DROPDOWN
// ════════════════════════════════════════════════════════
function AdminLoginDropdown({creds,onLogin,onClose}) {
  const [mode,setMode]=useState(null); // null | "owner" | "member"
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [err,setErr]=useState("");

  const attempt=()=>{
    if(mode==="owner"){
      if(username===creds.owner.username&&password===creds.owner.password){onLogin("owner");return;}
      setErr("Incorrect username or password.");
    } else {
      const m=creds.members.find(m=>m.username===username&&m.password===password);
      if(m){onLogin(m.id);return;}
      setErr("Incorrect username or password.");
    }
  };

  if(!mode) return (
    <div style={{position:"fixed",top:52,right:24,zIndex:300,background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:14,padding:"20px",width:280,boxShadow:"0 12px 40px rgba(0,0,0,0.4)",animation:"fadeIn 0.2s ease"}}>
      <div style={{fontFamily:"var(--font-head)",fontWeight:800,marginBottom:16,fontSize:"0.95rem"}}>🔐 Admin Login</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <button onClick={()=>setMode("owner")} style={{...BS("var(--accent)"),padding:"12px",fontSize:"0.9rem",borderRadius:12}}>👑 Owner Login</button>
        <button onClick={()=>setMode("member")} style={{...BS("var(--card)"),color:"var(--muted)",border:"1.5px solid var(--border)",padding:"12px",fontSize:"0.9rem",borderRadius:12}}>👤 Team Member Login</button>
      </div>
      <button onClick={onClose} style={{width:"100%",background:"transparent",border:"none",color:"var(--muted)",marginTop:14,cursor:"pointer",fontSize:"0.82rem",padding:"6px"}}>Cancel</button>
    </div>
  );

  return (
    <div style={{position:"fixed",top:52,right:24,zIndex:300,background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:14,padding:"20px",width:300,boxShadow:"0 12px 40px rgba(0,0,0,0.4)",animation:"fadeIn 0.2s ease"}}>
      <div style={{fontFamily:"var(--font-head)",fontWeight:800,marginBottom:4,fontSize:"0.95rem"}}>{mode==="owner"?"👑 Owner Login":"👤 Team Member Login"}</div>
      <div style={{fontSize:"0.75rem",opacity:0.45,marginBottom:14}}>Enter your credentials to continue</div>
      <input placeholder="Username" value={username} onChange={e=>{setUsername(e.target.value);setErr("");}} style={{...IS,marginBottom:8}} onKeyDown={e=>e.key==="Enter"&&attempt()}/>
      <input type="password" placeholder="Password" value={password} onChange={e=>{setPassword(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&attempt()} style={{...IS,marginBottom:err?6:12}}/>
      {err&&<div style={{color:"#ef4444",fontSize:"0.78rem",marginBottom:10}}>{err}</div>}
      <button onClick={attempt} style={{...BS("var(--accent)"),width:"100%",padding:"10px"}}>Login →</button>
      <button onClick={()=>{setMode(null);setUsername("");setPassword("");setErr("");}} style={{width:"100%",background:"transparent",border:"none",color:"var(--muted)",marginTop:10,cursor:"pointer",fontSize:"0.82rem",padding:"6px"}}>← Back</button>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  FIRST-LOGIN FORCE-CHANGE PASSWORD
// ════════════════════════════════════════════════════════
function ForceChangePassword({member,onSave}) {
  const save=(_,newPw)=>{onSave(member.id,newPw);};
  return (
    <div style={{paddingTop:80,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 24px"}}>
      <div style={{maxWidth:460,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:"2.5rem",marginBottom:10}}>🔒</div>
          <div style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:"1.4rem",marginBottom:6}}>Set Your Password</div>
          <div style={{fontSize:"0.85rem",opacity:0.6}}>Hello <b>{member.username}</b>! This is your first login. Please set a personal password.</div>
        </div>
        <ChangePasswordForm onSave={save} isFirstTime={true} currentLabel={member.username}/>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════════════
export default function App() {
  const [resources,setResourcesLocal]=useState(INITIAL_RESOURCES);
  const [faculty,setFacultyLocal]=useState(INITIAL_FACULTY);
  const [posts,setPostsLocal]=useState(INITIAL_POSTS);
  const [ticketEvents,setTicketEventsLocal]=useState([]);
  const [registrations,setRegistrationsLocal]=useState([]);
  const [creds,setCredsLocal]=useState(DEFAULT_CREDS);
  const [dbReady,setDbReady]=useState(false);
  const [dbError,setDbError]=useState(null);

  // adminRole: null (logged out) | "owner" | member id string
  const [adminRole,setAdminRole]=useState(null);
  const [view,setView]=useState("portal"); // "portal"|"admin"|"tickets"
  const [showAdminLogin,setShowAdminLogin]=useState(false);
  const [ticketOpenEventId,setTicketOpenEventId]=useState(null);

  const [activeYear,setActiveYear]=useState(null);
  const [activeFeature,setActiveFeature]=useState(null);
  const [focusPostId,setFocusPostId]=useState(null);
  const mainRef=useRef();

  // ── FIRESTORE REAL-TIME LISTENERS ──────────────────────
  useEffect(()=>{
    const unsubs=[];
    let ready=0;
    const markReady=()=>{ready++;if(ready>=6)setDbReady(true);};

    // resources (single doc)
    unsubs.push(onSnapshot(doc(db,"portal","resources"),snap=>{
      if(snap.exists())setResourcesLocal(snap.data());
      else setDoc(doc(db,"portal","resources"),INITIAL_RESOURCES).catch(()=>{});
      markReady();
    },e=>{setDbError(e.message);}));

    // creds (single doc)
    unsubs.push(onSnapshot(doc(db,"portal","creds"),snap=>{
      if(snap.exists())setCredsLocal(snap.data());
      else setDoc(doc(db,"portal","creds"),DEFAULT_CREDS).catch(()=>{});
      markReady();
    },e=>{setDbError(e.message);}));

    // faculty (collection)
    unsubs.push(onSnapshot(collection(db,"faculty"),snap=>{
      if(snap.empty){
        // seed initial faculty
        const batch=writeBatch(db);
        INITIAL_FACULTY.forEach(f=>batch.set(doc(db,"faculty",String(f.id)),f));
        batch.commit().catch(()=>{});
      } else {
        setFacultyLocal(snap.docs.map(d=>d.data()));
      }
      markReady();
    },e=>{setDbError(e.message);}));

    // posts (collection)
    unsubs.push(onSnapshot(collection(db,"posts"),snap=>{
      if(snap.empty){
        const batch=writeBatch(db);
        INITIAL_POSTS.forEach(p=>batch.set(doc(db,"posts",p.id),p));
        batch.commit().catch(()=>{});
      } else {
        setPostsLocal(snap.docs.map(d=>d.data()).sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||(b.date-a.date)));
      }
      markReady();
    },e=>{setDbError(e.message);}));

    // ticketEvents (collection)
    unsubs.push(onSnapshot(collection(db,"ticketEvents"),snap=>{
      setTicketEventsLocal(snap.docs.map(d=>d.data()));
      markReady();
    },e=>{setDbError(e.message);}));

    // registrations (collection)
    unsubs.push(onSnapshot(collection(db,"registrations"),snap=>{
      setRegistrationsLocal(snap.docs.map(d=>d.data()));
      markReady();
    },e=>{setDbError(e.message);}));

    return()=>unsubs.forEach(u=>u());
  },[]);

  // ── FIRESTORE WRITE HELPERS ────────────────────────────
  // resources
  const setResources=useCallback(updater=>{
    setResourcesLocal(prev=>{
      const next=typeof updater==="function"?updater(prev):updater;
      setDoc(doc(db,"portal","resources"),next).catch(console.error);
      return next;
    });
  },[]);

  // creds
  const setCreds=useCallback(updater=>{
    setCredsLocal(prev=>{
      const next=typeof updater==="function"?updater(prev):updater;
      setDoc(doc(db,"portal","creds"),next).catch(console.error);
      return next;
    });
  },[]);

  // faculty — collection, each item has numeric id
  const setFaculty=useCallback(updater=>{
    setFacultyLocal(prev=>{
      const next=typeof updater==="function"?updater(prev):updater;
      // diff: delete removed, upsert changed/added
      const prevIds=new Set(prev.map(f=>String(f.id)));
      const nextIds=new Set(next.map(f=>String(f.id)));
      const batch=writeBatch(db);
      prevIds.forEach(id=>{if(!nextIds.has(id))batch.delete(doc(db,"faculty",id));});
      next.forEach(f=>batch.set(doc(db,"faculty",String(f.id)),f));
      batch.commit().catch(console.error);
      return next;
    });
  },[]);

  // posts — collection
  const setPosts=useCallback(updater=>{
    setPostsLocal(prev=>{
      const next=typeof updater==="function"?updater(prev):updater;
      const prevIds=new Set(prev.map(p=>p.id));
      const nextIds=new Set(next.map(p=>p.id));
      const batch=writeBatch(db);
      prevIds.forEach(id=>{if(!nextIds.has(id))batch.delete(doc(db,"posts",id));});
      next.forEach(p=>batch.set(doc(db,"posts",p.id),p));
      batch.commit().catch(console.error);
      return next;
    });
  },[]);

  // ticketEvents — collection
  const setTicketEvents=useCallback(updater=>{
    setTicketEventsLocal(prev=>{
      const next=typeof updater==="function"?updater(prev):updater;
      const prevIds=new Set(prev.map(e=>e.id));
      const nextIds=new Set(next.map(e=>e.id));
      const batch=writeBatch(db);
      prevIds.forEach(id=>{if(!nextIds.has(id))batch.delete(doc(db,"ticketEvents",id));});
      next.forEach(e=>batch.set(doc(db,"ticketEvents",e.id),e));
      batch.commit().catch(console.error);
      return next;
    });
  },[]);

  // registrations — collection
  const setRegistrations=useCallback(updater=>{
    setRegistrationsLocal(prev=>{
      const next=typeof updater==="function"?updater(prev):updater;
      const prevIds=new Set(prev.map(r=>r.id));
      const nextIds=new Set(next.map(r=>r.id));
      const batch=writeBatch(db);
      prevIds.forEach(id=>{if(!nextIds.has(id))batch.delete(doc(db,"registrations",id));});
      next.forEach(r=>batch.set(doc(db,"registrations",r.id),r));
      batch.commit().catch(console.error);
      return next;
    });
  },[]);

  // Handle ?post= deep link
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const pid=params.get("post");
    if(pid){setActiveFeature("events");setFocusPostId(pid);setTimeout(()=>mainRef.current?.scrollIntoView({behavior:"smooth"}),300);}
  },[]);

  const adminLoggedIn=adminRole!==null;
  const loggedMember=adminRole&&adminRole!=="owner"?creds.members.find(m=>m.id===adminRole):null;
  const needsPasswordChange=loggedMember?.mustChangePassword;

  const handleLogin=(role)=>{setAdminRole(role);setShowAdminLogin(false);if(role==="owner"||!creds.members.find(m=>m.id===role)?.mustChangePassword){setView("admin");}};
  const logout=()=>{setAdminRole(null);setView("portal");};
  const handleMemberPwSave=(memberId,newPw)=>{setCreds(p=>({...p,members:p.members.map(m=>m.id===memberId?{...m,password:newPw,mustChangePassword:false}:m)}));setView("admin");};
  const openYear=y=>{setActiveYear(v=>v===y?null:y);setActiveFeature(null);};
  const openFeature=f=>{setActiveFeature(v=>v===f?null:f);setActiveYear(null);};
  const openTickets=(eventId)=>{setView("tickets");setTicketOpenEventId(eventId||null);};

  // ── DB LOADING / ERROR SCREENS ─────────────────────────
  if(dbError) return (
    <div style={{minHeight:"100vh",background:"#0f1117",color:"#e8eaf0",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:24,fontFamily:"sans-serif"}}>
      <div style={{fontSize:"2.5rem"}}>🔥</div>
      <div style={{fontWeight:900,fontSize:"1.2rem"}}>Firebase Connection Error</div>
      <div style={{opacity:0.6,fontSize:"0.88rem",maxWidth:480,textAlign:"center",lineHeight:1.7}}>{dbError}<br/><br/>Check that your <code>firebase.js</code> config is correct and that Firestore is enabled in your Firebase console.</div>
    </div>
  );

  if(!dbReady) return (
    <div style={{minHeight:"100vh",background:"#0f1117",color:"#e8eaf0",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,fontFamily:"sans-serif"}}>
      <div style={{width:40,height:40,border:"4px solid #252a38",borderTop:"4px solid #6366f1",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <div style={{opacity:0.5,fontSize:"0.88rem"}}>Connecting to database…</div>
    </div>
  );

  // Force password change for first-login members
  if(adminLoggedIn&&needsPasswordChange&&loggedMember) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');:root{--bg:#0f1117;--card:#181c26;--border:#252a38;--accent:#6366f1;--accent2:#a78bfa;--text:#e8eaf0;--muted:#8891a8;--font-head:'Syne',sans-serif;--font-body:'DM Sans',sans-serif;}*{margin:0;padding:0;box-sizing:border-box;}body,#root{background:var(--bg);color:var(--text);font-family:var(--font-body);min-height:100vh;}@keyframes fadeIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}`}</style>
        <ForceChangePassword member={loggedMember} onSave={handleMemberPwSave}/>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        :root{--bg:#0f1117;--card:#181c26;--border:#252a38;--accent:#6366f1;--accent2:#a78bfa;--text:#e8eaf0;--muted:#8891a8;--font-head:'Syne',sans-serif;--font-body:'DM Sans',sans-serif;}
        *{margin:0;padding:0;box-sizing:border-box;}
        body,#root{background:var(--bg);color:var(--text);font-family:var(--font-body);min-height:100vh;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes floatY{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}
        ::-webkit-scrollbar{width:6px;height:6px;} ::-webkit-scrollbar-track{background:var(--bg);} ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:3px;}
        textarea,input,select{font-family:var(--font-body);}
        .post-body img{max-width:100%;border-radius:8px;margin:4px 0;display:block;}
        .post-body video{max-width:100%;border-radius:8px;margin:4px 0;display:block;}
        .post-body audio{width:100%;margin:4px 0;display:block;}
        .post-body a{color:var(--accent2);text-decoration:underline;}
        .post-body a:hover{opacity:0.8;}
        .post-body b,.post-body strong{font-weight:800;}
        .post-body i,.post-body em{font-style:italic;}
        .post-body u{text-decoration:underline;}
        .post-body s{text-decoration:line-through;}
      `}</style>

      {/* ── TOPBAR ── */}
      <div style={{position:"fixed",top:0,left:0,right:0,zIndex:200,background:"rgba(15,17,23,0.93)",backdropFilter:"blur(12px)",borderBottom:"1px solid var(--border)",padding:"10px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:"0.95rem",color:"var(--accent2)",cursor:"pointer"}} onClick={()=>{setView("portal");setActiveYear(null);setActiveFeature(null);}}>📚 CSE Portal</span>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {view!=="portal"&&<button onClick={()=>setView("portal")} style={{...BS("transparent"),color:"var(--muted)",border:"1.5px solid var(--border)",padding:"7px 14px",fontSize:"0.8rem"}}>← Portal</button>}
          {view==="portal"&&<button onClick={()=>openTickets(null)} style={{...BS("transparent"),color:"#f59e0b",border:"1.5px solid #f59e0b44",padding:"7px 14px",fontSize:"0.8rem"}}>🎟️ Tickets</button>}
          {!adminLoggedIn&&<button onClick={()=>setShowAdminLogin(p=>!p)} style={{...BS("transparent"),color:"var(--muted)",border:"1.5px solid var(--border)",padding:"7px 14px",fontSize:"0.8rem"}}>🔐 Admin</button>}
          {adminLoggedIn&&view!=="admin"&&<button onClick={()=>setView("admin")} style={{...BS("var(--accent)"),padding:"7px 14px",fontSize:"0.8rem"}}>⚙️ Dashboard</button>}
          {adminLoggedIn&&<button onClick={logout} style={{...BS("#ef4444"),padding:"7px 14px",fontSize:"0.8rem"}}>Logout</button>}
        </div>
      </div>

      {/* Admin login dropdown */}
      {showAdminLogin&&!adminLoggedIn&&<AdminLoginDropdown creds={creds} onLogin={handleLogin} onClose={()=>setShowAdminLogin(false)}/>}
      {showAdminLogin&&adminLoggedIn&&<div style={{position:"fixed",inset:0,zIndex:299}} onClick={()=>setShowAdminLogin(false)}/>}

      {/* ── TICKET PORTAL VIEW ── */}
      {view==="tickets"&&(
        <div style={{paddingTop:70,maxWidth:800,margin:"0 auto",padding:"80px 24px"}}>
          <TicketPortal ticketEvents={ticketEvents} onSubmitRegistration={r=>setRegistrations(p=>[...p,r])} initialEventId={ticketOpenEventId}/>
        </div>
      )}

      {/* ── ADMIN DASHBOARD VIEW ── */}
      {view==="admin"&&adminLoggedIn&&(
        <div style={{paddingTop:70,maxWidth:1100,margin:"0 auto",padding:"80px 24px"}}>
          <AdminDashboard resources={resources} setResources={setResources} faculty={faculty} setFaculty={setFaculty} ticketEvents={ticketEvents} setTicketEvents={setTicketEvents} registrations={registrations} setRegistrations={setRegistrations} creds={creds} setCreds={setCreds} adminRole={adminRole} onLogout={logout}/>
        </div>
      )}

      {/* ── STUDENT PORTAL VIEW ── */}
      {view==="portal"&&(
        <>
          {/* Hero */}
          <section style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",padding:"80px 24px 40px",textAlign:"center"}}>
            <div style={{position:"absolute",inset:0,zIndex:0,background:"radial-gradient(ellipse 80% 60% at 50% 0%,rgba(99,102,241,0.18) 0%,transparent 70%),radial-gradient(ellipse 60% 40% at 80% 80%,rgba(167,139,250,0.1) 0%,transparent 60%)"}}/>
            <div style={{position:"absolute",inset:0,zIndex:0,opacity:0.04,backgroundImage:"linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>
            <div style={{position:"relative",zIndex:1,maxWidth:760,animation:"fadeIn 0.8s ease"}}>
              <div style={{display:"inline-block",background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.35)",borderRadius:100,padding:"6px 18px",fontSize:"0.78rem",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"var(--accent2)",marginBottom:28,fontFamily:"var(--font-head)"}}>CSE Department Portal</div>
              <h1 style={{fontFamily:"var(--font-head)",fontSize:"clamp(2.4rem,7vw,4.8rem)",fontWeight:900,lineHeight:1.05,marginBottom:20,letterSpacing:"-0.02em",background:"linear-gradient(135deg,#e8eaf0 0%,var(--accent2) 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                Welcome to the<br/>Your College Portal
              </h1>
              <p style={{fontSize:"clamp(1rem,2.5vw,1.25rem)",opacity:0.7,marginBottom:10,fontStyle:"italic"}}>Stay Connected. Stay Informed.</p>
              <p style={{fontSize:"0.85rem",opacity:0.45,marginBottom:40}}>Created by Anurag Jha in collaboration with Your Friend</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center",marginBottom:48}}>
                {["📢 Academic notices","📅 Exam schedules","🏆 Event announcements","📝 Assignment deadlines","🔔 Emergency updates"].map(t=>(
                  <span key={t} style={{background:"rgba(255,255,255,0.05)",border:"1px solid var(--border)",borderRadius:100,padding:"8px 16px",fontSize:"0.83rem"}}>{t}</span>
                ))}
              </div>
              <button onClick={()=>mainRef.current?.scrollIntoView({behavior:"smooth"})} style={{background:"var(--accent)",color:"#fff",border:"none",borderRadius:100,padding:"16px 40px",fontFamily:"var(--font-head)",fontWeight:800,fontSize:"1rem",cursor:"pointer",boxShadow:"0 0 40px rgba(99,102,241,0.35)",animation:"floatY 3s ease-in-out infinite"}}>
                Explore Portal ↓
              </button>
            </div>
          </section>

          {/* Main */}
          <section ref={mainRef} style={{maxWidth:900,margin:"0 auto",padding:"60px 24px 80px"}}>
            {/* Year buttons */}
            <div style={{marginBottom:16}}>
              <div style={{textAlign:"center",fontFamily:"var(--font-head)",fontSize:"0.75rem",letterSpacing:"0.15em",textTransform:"uppercase",opacity:0.4,marginBottom:16}}>Select Your Year</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:12,justifyContent:"center"}}>
                {[1,2,3,4].map(y=>(
                  <button key={y} onClick={()=>openYear(y)} style={{background:activeYear===y?"var(--accent)":"var(--card)",color:activeYear===y?"#fff":"var(--text)",border:`2px solid ${activeYear===y?"var(--accent)":"var(--border)"}`,borderRadius:14,padding:"16px 28px",cursor:"pointer",fontFamily:"var(--font-head)",fontWeight:800,fontSize:"0.95rem",transition:"all 0.18s",flex:"1 1 180px",maxWidth:210}}>
                    {y===1?"1st":y===2?"2nd":y===3?"3rd":"4th"} Year — CSE
                  </button>
                ))}
              </div>
            </div>

            {activeYear!==null&&(
              <div style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:18,padding:"28px 24px",marginBottom:24,animation:"fadeIn 0.3s ease"}}>
                {activeYear<=2?(
                  <><h2 style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:"1.4rem",marginBottom:20}}>{activeYear===1?"First":"Second"} Year — CSE Resources</h2><YearResources year={activeYear} resources={resources}/></>
                ):(
                  <><h2 style={{fontFamily:"var(--font-head)",fontWeight:900,fontSize:"1.4rem",marginBottom:20}}>{activeYear===3?"Third":"Fourth"} Year — CSE Resources</h2><Year34Resources year={activeYear} resources={resources}/></>
                )}
              </div>
            )}

            {/* Feature buttons */}
            <div style={{marginTop:32,marginBottom:16}}>
              <div style={{textAlign:"center",fontFamily:"var(--font-head)",fontSize:"0.75rem",letterSpacing:"0.15em",textTransform:"uppercase",opacity:0.4,marginBottom:16}}>Tools & Features</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:12,justifyContent:"center"}}>
                {[{key:"faculty",label:"🔍 Find Faculty"},{key:"sgpa",label:"📊 SGPA"},{key:"cgpa",label:"🎓 CGPA"},{key:"events",label:"📢 Club/Events"}].map(f=>(
                  <button key={f.key} onClick={()=>openFeature(f.key)} style={{background:activeFeature===f.key?"var(--accent)":"var(--card)",color:activeFeature===f.key?"#fff":"var(--text)",border:`2px solid ${activeFeature===f.key?"var(--accent)":"var(--border)"}`,borderRadius:14,padding:"14px 24px",cursor:"pointer",fontFamily:"var(--font-head)",fontWeight:800,fontSize:"0.9rem",transition:"all 0.18s",flex:"1 1 150px",maxWidth:200}}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {activeFeature&&(
              <div style={{background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:18,padding:"28px 24px",animation:"fadeIn 0.3s ease"}}>
                {activeFeature==="faculty"&&<FindFaculty faculty={faculty}/>}
                {activeFeature==="sgpa"&&<SGPACalculator/>}
                {activeFeature==="cgpa"&&<CGPACalculator onGoSGPA={()=>openFeature("sgpa")}/>}
                {activeFeature==="events"&&<ClubEvents adminLoggedIn={adminLoggedIn} posts={posts} setPosts={setPosts} ticketEvents={ticketEvents} onOpenTicket={(eid)=>openTickets(eid)} focusPostId={focusPostId}/>}
              </div>
            )}
          </section>

          <footer style={{borderTop:"1px solid var(--border)",textAlign:"center",padding:"28px 24px",fontSize:"0.82rem",opacity:0.4}}>
            Made with ❤️ by Anurag Jha · Your College CSE Portal · All rights reserved
          </footer>
        </>
      )}
    </>
  );
}

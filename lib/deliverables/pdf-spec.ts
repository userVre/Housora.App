import { jsPDF } from "jspdf";
import { register } from "./registry";
register({
  id:"pdf-spec", name:"PDF Spec Sheet", mime:"application/pdf",
  render: async ({projectName, clientName, rooms})=>{
    const pdf=new jsPDF(); pdf.setFontSize(18); pdf.text(`${projectName} — ${clientName}`,10,16);
    let y=28; for(const r of rooms){ pdf.setFontSize(12); pdf.text(`${r.name}`,10,y); y+=8; // before/after thumbs would be added via addImage if URLs are dataUrls
    }
    return pdf.output("blob");
  }
});

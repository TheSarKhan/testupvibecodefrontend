const { jsPDF } = require("jspdf");

const doc = new jsPDF();

doc.setFontSize(22);
doc.text("Riyaziyyat Testi", 20, 20);

doc.setFontSize(14);
doc.text("Sual 1. Aşağıdakı tənliyi həll edin:", 20, 60);

doc.setFontSize(18);
doc.text("2x + 5 = 15", 30, 80);

doc.setFontSize(14);
doc.text("A) 2   B) 5   C) 10   D) 15", 20, 110);

doc.save("test_exam.pdf");
console.log("PDF created: test_exam.pdf");

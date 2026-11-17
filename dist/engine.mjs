export const figures = [
 "111111","000000","100010","010001","111010","010111","010000","000010",
 "111011","110111","111000","000111","101111","111101","001000","000100",
 "100110","011001","110000","000011","100101","101001","000001","100000",
 "100111","111001","100001","011110","010010","101101","001110","011100",
 "001111","111100","000101","101000","101011","110101","001010","010100",
 "110001","100011","111110","011111","000110","011000","010110","011010",
 "101110","011101","100100","001001","001011","110100","101100","001101",
 "011011","110110","010011","110010","110011","001100","101010","010101"
];
const numbers = new Map(figures.map((value,index) => [value,index+1]));
export const trigrams = {
 "111":["乾","Qián","Cielo","Fuerza creadora","Tres líneas yang. El Cielo se asocia con el vigor y la iniciativa."],
 "000":["坤","Kūn","Tierra","Receptividad","Tres líneas yin. La Tierra se asocia con sostener, acoger y dar forma."],
 "100":["震","Zhèn","Trueno","Movimiento","Una línea yang irrumpe en la base. El Trueno despierta y pone en movimiento."],
 "011":["巽","Xùn","Viento","Penetración","Una línea yin en la base bajo dos yang. Viento y madera evocan la influencia gradual."],
 "010":["坎","Kǎn","Agua","Lo abismal","Una línea yang entre dos yin. El agua evoca profundidad, riesgo y el fluir entre obstáculos."],
 "101":["離","Lí","Fuego","Claridad","Una línea yin entre dos yang. El fuego ilumina y se adhiere a aquello que lo alimenta."],
 "001":["艮","Gèn","Montaña","Quietud","Una línea yang en la cima. La montaña evoca detenerse y reconocer un límite."],
 "110":["兌","Duì","Lago","Alegría","Una línea yin se abre arriba. El lago evoca alegría, intercambio y apertura."]
};
export const trigramOrder = ["111","000","100","011","010","101","001","110"];
export const states = {6:"Yin cambiante",7:"Yang estable",8:"Yin estable",9:"Yang cambiante"};
export function figureNumber(bits) { return numbers.get(bits); }
export function calculate(values) {
 if (values.length !== 6 || Array.from(values).some(value => ![6,7,8,9].includes(value))) throw new Error("Introduce seis valores entre 6 y 9.");
 const initial = values.map(value=>value%2).join("");
 const changes = values.flatMap((value,i)=>value===6||value===9 ? [i+1] : []);
 const final = Array.from(initial,(bit,i)=>changes.includes(i+1)?1-Number(bit):bit).join("");
 return {initial:figureNumber(initial),final:figureNumber(final),changes};
}
export function valuesFromFigure(initial, changes) {
 const bits = figures[initial-1];
 if (!Number.isInteger(initial) || !bits || changes.some(i => !Number.isInteger(i) || i < 1 || i > 6)) {
  throw new Error("Elige un hexagrama inicial y líneas del 1 al 6.");
 }
 return Array.from(bits, (bit, i) => {
  const changing = changes.includes(i+1);
  return bit === "1" ? (changing ? 9 : 7) : (changing ? 6 : 8);
 });
}
export function choosePassages(result, mode) {
 const {initial,final,changes}=result;
 const unchanged=[1,2,3,4,5,6].filter(i=>!changes.includes(i));
 const judge=(id,main=false)=>({id,kind:"judgment",main});
 const line=(id,index,main=false)=>({id,kind:"line",index,main});
 if (mode==="all") return [judge(initial),...changes.map(i=>line(initial,i)),...(changes.length?[judge(final)]:[])];
 switch (changes.length) {
  case 0: return [judge(initial,true)];
  case 1: return [line(initial,changes[0],true)];
  case 2: return [line(initial,changes[1],true),line(initial,changes[0])];
  case 3: return [judge(initial),judge(final)];
  case 4: return [line(final,unchanged[0],true),line(final,unchanged[1])];
  case 5: return [line(final,unchanged[0],true)];
  case 6: return initial<=2?[{id:initial,kind:"special",main:true}]:[judge(final,true)];
 }
}
export function simulatedYarrow(draw) {
 if (!Number.isInteger(draw)||draw<0||draw>15) throw new Error("Se requiere un entero de 0 a 15.");
 return draw===0?6:draw<6?7:draw<13?8:9;
}

import data from './plan-data.json';

// The supplied SVG is the single source of plan coordinates. One uniform scale
// uses the 883.976 SVG-unit hall length = 120 m. Heights remain photo estimates.
export const PLAN = data;
export const S = data.scale;
export const toWorld = (u,v,y=0) => [(v-data.origin[1])*S,y,(data.origin[0]-u)*S];
export const outline = id => data.elements[id].points.map(([u,v])=>{const [x,,z]=toWorld(u,v);return [x,z];});
export const center = (id,y=0) => {const b=data.elements[id].bounds;return toWorld((b[0]+b[2])/2,(b[1]+b[3])/2,y);};
export const size = id => {const b=data.elements[id].bounds;return [(b[3]-b[1])*S,(b[2]-b[0])*S];};
export const SOURCE = {
  land:1, context:[341,342,345,346], hall:238, office:[237,241],
  warehouse:240, warehouseDeHaas:325, wash:239, basinPlatform:244,
  crane:245, pontoons:[343,344], lift:[264,265,266],
  ships:[326,327,330,332,333,334,339], afloat:[331,335,336,337,338],
  interactiveShip:328, destination:329, route:351,
  shelters:[276,360,373], containers:[278,279,280,281,282,283,284,285,358],
  cars:[316,317,318,319,320,321,322,323,324]
};
export const LIFT_START = toWorld(1343.7015,1284.4555);
export const BOAT_START = center(SOURCE.interactiveShip);
// Straight approach to the berth after turning in place on the open apron.
export const BOAT_DESTINATION = toWorld(1062,900);
export const BERTH_YAW = 0;
// Local vessel offsets leave the turn clear; the SVG ground stays exact.
export const SHIP_OFFSETS = {339:[-30,0],326:[15,0]};
export function placedCenter(id,y=0){const b=data.elements[id].bounds,[du,dv]=SHIP_OFFSETS[id]||[0,0];return toWorld((b[0]+b[2])/2+du,(b[1]+b[3])/2+dv,y);}
export const PARKING_ROWS = [
  [2,14],[15,27],[28,40],[41,53],[54,66],[67,79],[80,92],
  [93,105],[106,122],[123,135],[136,148],[149,161],[162,174],
  [175,187],[188,200],[201,213],[214,221],[223,235]
].map(([first,last])=>{
  const rows=data.elements.slice(first,last+1).map(e=>e.bounds);
  return [Math.min(...rows.map(b=>b[0])),Math.min(...rows.map(b=>b[1])),Math.max(...rows.map(b=>b[2])),Math.max(...rows.map(b=>b[3]))];
});

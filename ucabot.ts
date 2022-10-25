/**
 * Functions for ucaBot
 */
//% weight=5 color=#ff9da5  icon="\uf207"
namespace ucaBot {
  const STM8_ADDRESSS = 0x10;
  let f: string= null;
  let d: string= null;
  let c: string= null;
  let p: string[]= null;
  let resp: string=null;
  let id = '0';
  let n_agents = '0';
  let near = '0';
  let name: string= null;
  let x= 0;
  let y= 0;
  let act_val= false;
  let tt= 0;
  let called= false;
  let r_angle= 0;
  let wait= false;
  let repeat= false;
  let calls= '';
  let arrived= '';
  let id2fw= '';
  let fw_req= false;
  let cl= false;
  let al= false;
  let home: number[]= [];
  let search= false;
  let found= false;
  let type= '';
  let x_o: number= null;
  let y_o: number= null;
  let r_o: number= null;
  let id_ob= '';
  let busy= false;
  let obj_on = 0;
  
  export enum Pos {
    //% block="x"
    x,
    //% block="y"
    y,
  }

  export enum Dir {
    //% block="Right"
    right,
    //% block="Left"
    left,
  }
  /**
   * TODO: Init agent with an ID on Sandbox.
   */
  //% block="Init agent on Sandbox"
  //% weight=200
  export function initAgent(): void {
    radio.setGroup(23);
    radio.onReceivedString(function (receivedString) {
      f = receivedString[0];
      d = receivedString[1];
      c = receivedString[2] + receivedString[3];
      p = [];
      if (d == 'F' || d == id){
        console.log(receivedString);  
        if (receivedString.length > 4){
          let str_p = receivedString.slice(4);
          let limit = (str_p.split("/").length-1); 
          if (limit > 0){
            let index = 0;
            let aux = 0;
            for (let i = 0; i < limit; i++){ 
              if (i == 0){
                index = str_p.indexOf('/');
                p.push(str_p.slice(0, index));
              }
              else{
                index = str_p.indexOf('/', index + 1);
                p.push(str_p.slice(aux + 1, index));
              } 
              aux = index;
              let flag = 0;
              for (let char = 0; char < p[i].length; char++){  
                if (!((p[i][char] >= '0' && p[i][char] <= '9') || p[i][char]=='.'))
                  flag+=1; 
              }
              if (flag > 0)
                p[i] = p[i].replace('0',''); 
            }
          }
        }
        if (f == '0'){
          if (id == '0' && c == 'II'){
            id = p[0];
            basic.showString(id);
            basic.pause(1000);
            basic.clearScreen();
          }
          else if (n_agents == '0' && c == 'AI')
            n_agents = p[0];
          else if (c == 'GP'){
            x = parseFloat(p[0]);
            y = parseFloat(p[1]);
            tt = parseInt(p[2]);
            act_val = true;
          }
          else if (c == 'WN'){
            near = p[0];
            act_val = true;
          }
          else if (c == 'IC' || c == 'FC' || c == 'SC' || c == 'TO' || c == 'FS' || c == 'BU' || c == 'NB')
            act_val = true;
          else if (c == 'CA'){
            if (p.length > 0){
              if (p[0] != id){
                calls = p[0];
                called = true;
              }
            }
          }
          else if (c == 'NF' && wait)
            repeat = true;
          else if (c == 'AR')
            arrived = p[0];
          else if (c == 'FM'){
            id2fw = p[0];
            fw_req = true;
          }
          else if (c == 'CL' && !al)
            cl = true;
          else if (c == 'HO' && !home.length){
            home.push(parseInt(p[0]));
            home.push(parseInt(p[1]));
            home.push(parseFloat(p[2]));
            send('0', 'HO', null, false, -1);
          }
          else if ((c == 'BO' || c == 'SO') && search && !found){
            found = true;
            type = c;
            x_o = parseInt(p[0]);
            y_o = parseInt(p[1]);
            id_ob = p[2];
            r_o = parseFloat(p[3]);
          }
        }
      }
    });
    while (true) { 
      if (n_agents != '0' && id != '0'){
        basic.pause(50);
        break; 
      }
      delay(); 
    }
    return;
  } 
  /**
  * serialize msg and send request to sandBox.
  */ 
  function send(d: string, c: string, p: string, req: boolean, stop: number): boolean {
    resp = id + d + c;
    if (p)
      resp = resp + p + '/00';
    console.log('sent '+resp);
    delay();
    radio.sendString(resp);
    if (req){
      let n_times = 100;
      wait = true;
      for (let i = 0; i < n_times; i++){
        if (act_val){
          act_val = false;
          wait = false;
          return true;
        }
        else{
          if (i == stop)
            stopcar();
          if (repeat){
            repeat = false;
            if (stop > 0)
              stopcar();
            let res = send(d, c, p, req, stop);
            return res;
          }
        } 
        basic.pause(50);
      }
      wait = false;
      send('0', 'SS', null, false, -1);
      delay();
      return false;
    }
    else 
      return true;
  }
  
  function pid(p: number, min_prev: number, max_prev: number, min_new: number, max_new: number): number{
    let num = Math.round((p - min_prev) / (max_prev - min_prev) * (max_new - min_new) + min_new); 
    return num;
  }
  /**
  * Agents can set their name when initialized on SandBox.
  */ 
  //% block="Set name %inName"
  //% weight=196
  export function setName(inName: string): void {
    name = inName;
    send('0', 'NM', name, false, -1);
    delay();
  }
  /**
  * Agents can know their name on SandBox.
  */ 
  //% block="My name"
  //% weight=196
  export function myName(): string {
    if (name)
      return name;
    else
      return 'Name not set';
  }
  /**
  * Agents can know their number on SandBox.
  */ 
  //% block="My number (ID)"
  //% weight=195
  export function myNum(): number {
    let num = parseInt(id);
    return num;
  }
  /**
  * Agents can know their position in cm on SandBox.
  */ 
  //% block="My position %pos (cm)"
  //% weight=190
  export function myPos(pos: Pos): number { 
    if (send('0', 'GP', null, true, -1)){
      if(!pos)
        return x;
      else
        return y;
    }
    else
      return undefined;
  }
  /**
  * Agents can know their direction in degrees on SandBox.
  */ 
  //% block="My direction"
  //% weight=185
  export function myDir(): number { 
    if (send('0', 'GP', null, true, -1))
      return tt;
    else  
      return undefined;
  }
  /**
  * TODO: Rotate agent at an angle between 10 and 180
  * @param p degrees to rotate, eg: 90
  */ 
  //% block="Rotate agent %p ° to %dir"
  //% p.shadow="protractorPicker"
  //% p.min = 5 p.max = 180
  //% weight=180 
  export function rotate(p: number, dir: Dir) { 
    // request direction
    if (send('0', 'GP', null, true, -1)){
      let tt_p = 0;    let d = 0;
      if (!dir){
        tt_p = tt - p;
        if (tt_p < 0)
          tt_p = 360 + tt_p;
      }
      else{
        tt_p = tt + p;
        if (tt_p > 360)
          tt_p = tt_p - 360;
      }
      r_angle = tt_p;
      let p_aux = p;
      while (p > 4 && p <= p_aux){
        d = pid(p, 10, 180, 18, 20);
        if (!dir)
          motors(d, -d-9);
        else
          motors(-d-9, d);
        basic.pause(100);
        if (send('0', 'GP', null, true, 1)){
          p_aux = p;
          p =  Math.abs(tt_p - tt); 
          if (p > 180)
            p = 360 - p;
        }
        else
          return;   
      } 
      stopcar();
    }
    return;
  }
  /**
  * TODO: Move in centimeters.
  * @param cm cm to move, eg: 30 
  */ 
  //% block="Move forward %cm cm"
  //% cm.min = 1 cm.max = 90
  //% weight=175 
  export function move(cm: number): void { 
    if (send('0', 'GP', null, true, -1)){
      let aux = cm;  let v = 0;
      let xv = 0;    let yv = 0;
      let tt_o = tt; 
      let d_tt = 0;  let vc = 0;
      while (cm > 0 && cm <= aux){
        xv = x; 
        yv = y;
        v = pid(cm, 5, 100, 18, 25);
        motors(v, v);  
        basic.pause(250);
        if (send('0', 'GP', null, true, 4)){
          cm = cm - Math.sqrt((x - xv) ** 2 + (y - yv) ** 2);
          d_tt = tt_o - tt;
          if (Math.abs(d_tt) > 300)
            d_tt = 360 + d_tt;
          if (d_tt != 0 && Math.abs(d_tt) > 1){
            vc = pid(Math.abs(d_tt), 2, 15, 6, 12);
            if (d_tt < 0)
              motors(v + vc, v - vc);
            else
              motors(v - vc, v + vc);
            basic.pause(50);
          }
        }
        else
          return;
      }
      stopcar();
    }
    return;
  }
  function cm(x1: number, x2: number, y1: number, y2: number): number{
    let d = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    return Math.round(d);
  }
  function d2r(angle: number): number{
    let radians = angle / 180 * Math.PI;
    return radians;
  }
  function r2d(angle: number): number{
    let degrees = angle * 180 / Math.PI;
    return degrees;
  }
  function rt_angle(xa: number, xb: number, ya: number, yb: number, angle_a: number, d: number): number{
    let angle = -1 * d2r(angle_a);
    let xt = ((xb - xa) * Math.cos(angle)) - ((yb - ya) * Math.sin(angle));
    let yt = ((xb - xa) * Math.sin(angle)) + ((yb - ya) * Math.cos(angle));
    angle = Math.asin(yt / d);
    angle = r2d(angle);
    if (xt < 0)
      angle = 180 - angle;
    else{
      if (yt < 0)
        angle = 360 + angle;
    }
    return Math.round(angle);
  }
  /**
  * Go from a point to another.
  */ 
  //% block="Go to point x:%px y:%py"
  //% x.min = 5 x.max = 100
  //% y.min = 5 y.max = 57
  //% weight=170 
  export function toPoint(px: number, py: number, space = 0) {
    if (send('0', 'GP', null, true, -1)){
      let d = cm(px, x, py, y);
      let d_tt = 0;
      let v = 0;
      let vc = 0;
      let aux = 999;
      let angle = rt_angle(x, px, y, py, tt, d);
      if (angle > 7){
        if (angle > 180){
          angle = 360 - angle; 
          rotate(angle, 0);
        }
        else 
          rotate(angle, 1); 
      }
      else
        r_angle = tt;
      while (d > (4 + space) && d <= aux){
        if (send('0', 'GP', null, true, 4)){
          aux = d;
          d_tt = r_angle - tt;
          if (Math.abs(d_tt) > 300)
            d_tt = 360 + d_tt;
          if (d_tt != 0 && Math.abs(d_tt) > 1){
            vc = pid(Math.abs(d_tt), 2, 30, 6, 15);
            if (d_tt < 0)
              motors(v + vc, v - vc);
            else
              motors(v - vc, v + vc);
            basic.pause(50);
          }
          v = pid(d, 5, 100, 20, 25);
          motors(v, v);  
          d = cm(px, x, py, y);
          basic.pause(250);
        }
        else
          return;
      }
      stopcar();
    } 
    return;
  }
  /**
  * Agents can wander sandbox
  */ 
  //% block="Wander Sandbox"
  //% weight=168 
  export function wander(){
    control.inBackground(() => {
      while (true){
        if (!cl && !al && !ir() && !busy)
          motors(15, 15)
        if (ir() || busy)
          stopcar();
        basic.pause(25);
      }
    });
  }
  /**
  * Agents can detect objects and take them home
  */ 
  //% block="Detect objects"
  //% weight=167 
  export function detect(){
    search = true;
    send('0', 'SC', null, true, -1);
    while (true){
      if (found){
        search = false;
        send('0', 'FS', null, true, -1);
        break
      }
      delay(); 
    }
  }
  /**
  * Do something on object detected.
  */ 
  //% block="On object detected"
  //% weight=166
  export function onDetect(handler: () => void){
    control.onEvent(103, 3505, handler);
    control.inBackground(() => {
      while (true) { 
        if (found){
          found = false;
          control.raiseEvent(103, 3505, EventCreationMode.CreateAndFire); 
        }
        delay(); 
      }
    });
  }
  // sends msg
  function setBusy(){
    busy = true;
    send('0', 'BU', null, true, -1);
  }
  function notBusy(){
    busy = false;
    send('0', 'NB', null, true, -1);
  }
  function objError(){
    basic.showString('Cant take obj');
  }
  /**
  * Agents can go to objects and take them home
  */ 
  //% block="Go to detected object"
  //% weight=167 
  export function goForObj(){
    setBusy();
    if (x_o)
      toPoint(x_o, y_o, r_o);
    notBusy();
  }
/**
 * Take object with agent
 */ 
  //% block="Take object"
  //% weight=166 
  export function takeObj(){
    setBusy();
    if (type == 'SO')
      send('0', 'SO', id_ob, true, -1);
    else
      objError();
    notBusy();
  }
  /**
 * Take object between 2 agents
 */ 
  //% block="Take object between 2 agents"
  //% weight=165 
  export function ma_takeObj(){
    setBusy();
    if (type == 'BO'){
      if (parseInt(n_agents) > 1){
        askHelp();
        send('0', 'BO', id_ob, true, -1);
      }
      else
        objError();
    }
    else 
      objError();
    notBusy();
  }

  /**
  * Do something on collision received
  */ 
  //% block="On collision received"
  //% weight=164
  export function onCollision(handler: () => void){
    control.onEvent(102, 3504, handler);
    control.inBackground(() => {
      while (true) { 
        if (cl){
          send('0', 'CL', null, true, -1);
          control.raiseEvent(102, 3504, EventCreationMode.CreateAndFire); 
          cl = false;
        }
        delay(); 
      }
    });
  }
  /**
  * Avoid collision when received
  */ 
  //% block="Avoid collision"
  //% weight=163
  export function avoidCollision(){
    stopcar();
    al = true;
    motors(-31,-31);
    basic.pause(300);
    stopcar();
    let dir = Math.floor(Math.random() * 2);
    let a = Math.floor(Math.random() * 110) + 90;
    rotate(a, dir);
    send('0', 'FC', null, true, -1);
    move(1);
    al = false;
    return
  }
  /**
  * Agents can know how many agents are initialized on SandBox.
  */ 
  //% block="Number of agents on SandBox"
  //% weight=170 
  export function numberOfAgents(): number {
    let num = parseInt(n_agents);
    return num;
  }
/**
 * TODO: On all agents initialized on SandBox.
 */
  //% weight=165 
  //% block="On all agents initialized"
  export function Init_callback(handler: () => void) {
    control.onEvent(99, 3501, handler);
    control.inBackground(() => {
      while (true) { 
        if (n_agents != '0')
          control.raiseEvent(99, 3501, EventCreationMode.CreateAndFire); 
        delay(); 
      }
    });
    return;
  }
  /**
 * Agent is able to know which agent(s) are around or near itself.
 * @param d cm between agents, eg: 45
 */
  //% weight=160 
  //% block="Who are at least %d cm near me?"
  //% d.min = 12 d.max = 100
  export function nearMe(d: number): string { 
    if (send('0', 'WN', d.toString(), true, -1))
      return near;
    else
      return '0'
  }
/**
 * TODO: An agent can aks for other agent's help when needed
 */
  //% weight=145 
  //% block="Ask for help "
  //% id.min = 1 id.max = 3
  export function askHelp() {
    if (parseInt(n_agents) > 1){
      send('0', 'CA', 'F', false, -1);
      while (true){
        if (arrived != '')
          break
        delay();
      }
    }
    else 
      basic.showString('Could not ask 4 help');
    return;
  }
  /**
 * TODO: On an agent calling me
 */
  //% weight=140 
  //% block="On an agent calling me"
  export function calledByAgent(handler: () => void) {
    control.onEvent(100, 3502, handler);
    control.inBackground(() => {
      while (true) { 
        if (called){
          control.raiseEvent(100, 3502, EventCreationMode.CreateAndFire); 
          called = false;
        }
        delay(); 
      }
    });
    return;
  }
/**
 * TODO: Go where the leader is
 */
  //% weight=135 
  //% block="Go to the leader"
  export function goToLeader() {
    if (calls != ''){
      if (send('0', 'GP', calls, true, -1)){
        toPoint(x, y, 20);
        send('0', 'AR', calls, false, -1);
      }
      else 
        return;
    }
    return;
  }
  /**
 * TODO: On 'follow me' received, previously called.
 */
  //% weight=140 
  //% block="On 'follow me' received"
  export function askedToFollow(handler: () => void) {
    control.onEvent(101, 3503, handler);
    control.inBackground(() => {
      while (true) { 
        if (fw_req){
          control.raiseEvent(101, 3503, EventCreationMode.CreateAndFire); 
          fw_req = false;
        }
        delay(); 
      }
    });
    return;
  }
  /**
 * TODO: Indicates to an agent previously called to follow it.
 */
  //% weight=130 
  //% block="Follow me"
  export function followMe() {
    if (arrived != ''){
      send('0', 'FM', arrived, false, -1);
      basic.pause(5000);
    }
    else
      basic.showString('Ask for help first');
    return;
  }
  /**
 * TODO: Follow the leader who called it.
 */
  //% weight=130 
  //% block="Follow leader"
  export function followLeader() {
    if (id2fw != ''){
      if (send('0', 'GP', id2fw, true, -1)){
        let af = tt;
        if (send('0', 'GP', null, true, -1)){
          let aa = tt;
          let angle = Math.abs(af - aa);
          if (af > aa){
            if(angle > 180){
              angle = 360 - angle;
              rotate(angle, 0);
            }
            else
              rotate(angle, 1);
          }
          else if (aa > af){
            if (angle > 180){
              angle = 360 - angle;
              rotate(angle, 1);
            }
            else
              rotate(angle, 0);
          }
        }
        else
          return
      }
      else
        return
    }
    else
      basic.showString('Not asked to follow yet');
    return;
  }

  function motors(lspeed: number, rspeed: number) {
    let buf = pins.createBuffer(4);
    if (lspeed > 0) {
      buf[0] = 0x01; 
      buf[1] = 0x02; 
      buf[2] = lspeed; 
      buf[3] = 0; 
      pins.i2cWriteBuffer(STM8_ADDRESSS, buf); 
    } else {
      buf[0] = 0x01;
      buf[1] = 0x01;
      buf[2] = lspeed * -1;
      buf[3] = 0;
      pins.i2cWriteBuffer(STM8_ADDRESSS, buf); 
    }
    if (rspeed > 0) {
      buf[0] = 0x02;
      buf[1] = 0x02;
      buf[2] = rspeed;
      buf[3] = 0;
      pins.i2cWriteBuffer(STM8_ADDRESSS, buf); 
    } else {
      buf[0] = 0x02;
      buf[1] = 0x01;
      buf[2] = rspeed * -1;
      buf[3] = 0;
      pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
    }
  }
  /**
   * TODO: stopcar
   */
  //% block="Stop car now"
  //% weight=70
  export function stopcar() {
    motors(0, 0);
  }

  function ir(): boolean {
    pins.setPull(DigitalPin.P13, PinPullMode.PullNone);
    pins.setPull(DigitalPin.P14, PinPullMode.PullNone);
    let left = pins.digitalReadPin(DigitalPin.P13);
    let right = pins.digitalReadPin(DigitalPin.P14);
    if (!left && !right) 
      return true;
    else
      return false;
  }
}

  function delay(){
    basic.pause(20);
  }
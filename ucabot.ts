/**
 * Functions to ucaBot by ELECFREAKS Co.,Ltd.
 */
//% weight=5 color=#0fbc11  icon="\uf207"
namespace ucaBot {
  const STM8_ADDRESSS = 0x10;
  const ID_GROUP = 23;
  let IR_Val = 0;
  let _initEvents = true;

  // class for responses received by radio
  class Resp { 
    f: string; // f = source
    d: string; // d = destiny
    c: string; // c = command 
    p: string[]; // p = list of params or variable with one param
    // init constructor
    constructor(){
      this.f = null;
      this.d = null;
      this.c = null;
      this.p = [];
    }
    // methods
    set_header(f: string, d: string, c:  string): void{
      this.f = f;
      this.d = d;
      this.c = c; 
      this.p = [];
    }
    set_values(f: string, d: string, c:  string, p: string[]): void {
      this.set_header(f, d, c);
      this.p = p;
    }
    add_p(p: string): void{
      this.p.push(p);
    }
  }
  // empty object for storage response 
  let obj_resp = new Resp();
  let id_agent = '0';
  let n_agents = '0';
  let near_me = '0';
  let x = 0;
  let y = 0;
  let act_pos = false;
  let theta = 0;
  let called = false;
  let result_angle = 0;
  let waiting = false;
  let repeat = false;
  let calls = '';
  let arrived = '';
  let id2follow = '';
  let follow_req = false;
  let busy = false;
  let home: number[] = [];
  let x_o: number = null;
  let y_o: number = null;
  let id_ob = '';
  /**
   * Unit of Ultrasound Module
   */
  export enum SonarUnit {
    //% block="cm"
    Centimeters,
    //% block="inches"
    Inches,
  }
  /**
   * Select the position desired
   */
  export enum Position {
    //% block="x"
    x,
    //% block="y"
    y,
  }
  /**
 * Select the position desired
 */
  export enum RotateDir {
    //% block="Right"
    dir_right,
    //% block="Left"
    dir_left,
  }
  /**
   * Select the motor on the left or right
   */
  export enum MotorsList {
    //% blockId="M1" block="M1"
    M1 = 0,
    //% blockId="M2" block="M2"
    M2 = 1,
  }
  /**
   * Select the servo on the S1 or S2
   */
  export enum ServoList {
    //% block="S1"
    S1 = 0,
    //% block="S2"
    S2 = 1,
  }
  /**
   * Select the RGBLights on the left or right
   */
  export enum RGBLights {
    //% blockId="Right_RGB" block="Right_RGB"
    RGB_L = 1,
    //% blockId="Left_RGB" block="Left_RGB"
    RGB_R = 0,
    //% blockId="ALL" block="ALL"
    ALL = 3,
  }
  /**
   * Status List of Tracking Modules
   */
  export enum TrackingState {
    //% block="● ●" enumval=0
    L_R_line,

    //% block="◌ ●" enumval=1
    L_unline_R_line,

    //% block="● ◌" enumval=2
    L_line_R_unline,

    //% block="◌ ◌" enumval=3
    L_R_unline,
  }
  export enum Direction {
    //% block="Forward" enumval=0
    forward,
    //% block="Backward" enumval=1
    backward,
    //% block="Left" enumval=2
    left,
    //% block="Right" enumval=3
    right,
  }
  /**
   * Line Sensor events    MICROBIT_PIN_EVT_RISE
   */
  export enum MbEvents {
    //% block="Found"
    FindLine = DAL.MICROBIT_PIN_EVT_FALL,
    //% block="Lost"
    LoseLine = DAL.MICROBIT_PIN_EVT_RISE,
  }
  /**
   * Pins used to generate events
   */
  export enum MbPins {
    //% block="Left"
    Left = DAL.MICROBIT_ID_IO_P13,
    //% block="Right"
    Right = DAL.MICROBIT_ID_IO_P14,
  }
  /**
   * IR controller button
   */
  export enum IRButtons {
    //% blcok="Menu"
    Menu = 2,
    //% blcok="Up"
    Up = 5,
    //% blcok="Left"
    Left = 8,
    //% blcok="Right"
    Right = 10,
    //% blcok="Down"
    Down = 13,
    //% blcok="OK"
    OK = 9,
    //% blcok="Plus"
    Plus = 4,
    //% blcok="Minus"
    Minus = 12,
    //% blcok="Back"
    Back = 6,
    //% block="0"
    Zero = 14,
    //% block="1"
    One = 16,
    //% block="2"
    Two = 17,
    //% block="3"
    Three = 18,
    //% block="4"
    Four = 20,
    //% block="5"
    Five = 21,
    //% block="6"
    Six = 22,
    //% block="7"
    Seven = 24,
    //% block="8"
    Eight = 25,
    //% block="9"
    Nine = 26,
  }
  /**
   * TODO: Initialize agent with an ID on Sandbox.
   */
  //% block="Initialize agent on Sandbox"
  //% weight=200 color=#ff9da5
  export function initAgent(): void {
    radio.setGroup(ID_GROUP);
    radio.onReceivedString(function (receivedString) {
      let msg = receivedString;
      obj_resp.set_header(msg[0], msg[1], msg[2] + msg[3]);
      if (obj_resp.d == 'F' || obj_resp.d == id_agent){
        console.log(msg);  
        if (msg.length > 4){
          let str_p = msg.slice(4);
          let limit = (str_p.split("/").length - 1); 
          if (limit > 0){
            let index = 0;
            let aux = 0;
            for (let i = 0; i < limit; i++){ 
              if (i == 0){
                index = str_p.indexOf('/');
                obj_resp.add_p(str_p.slice(0, index));
              }
              else{
                index = str_p.indexOf('/', index + 1);
                obj_resp.add_p(str_p.slice(aux + 1, index));
              } 
              aux = index;
              let flag = 0;
              for (let char = 0; char < obj_resp.p[i].length; char++){  
                if (!((obj_resp.p[i][char] >= '0' && obj_resp.p[i][char] <= '9') || obj_resp.p[i][char]=='.'))
                  flag+=1; 
              }
              if (flag > 0)
                obj_resp.p[i] = obj_resp.p[i].replace('0',''); 
            }
          }
        }
        if (obj_resp.f == '0'){
          if (id_agent == '0' && obj_resp.c == 'II'){
            id_agent = obj_resp.p[0];
            basic.showString(id_agent);
            basic.pause(1000);
            basic.clearScreen();
          }
          else if (n_agents == '0' && obj_resp.c == 'AI')
            n_agents = obj_resp.p[0];
          else if (obj_resp.c == 'GP'){
            x = parseFloat(obj_resp.p[0]);
            y = parseFloat(obj_resp.p[1]);
            theta = parseInt(obj_resp.p[2]);
            act_pos = true;
          }
          else if (obj_resp.c == 'WN'){
            near_me = obj_resp.p[0];
            act_pos = true;
          }
          else if (obj_resp.c == 'CA'){
            if (obj_resp.p.length > 0){
              if (obj_resp.p[0] != id_agent){
                calls = obj_resp.p[0];
                called = true;
              }
            }
          }
          else if (obj_resp.c == 'NF' && waiting == true)
            repeat = true;
          else if (obj_resp.c == 'AR')
            arrived = obj_resp.p[0];
          else if (obj_resp.c == 'FM'){
            id2follow = obj_resp.p[0];
            follow_req = true;
          }
          else if (obj_resp.c == 'HO' && home.length == 0){
            home.push(parseFloat(obj_resp.p[0]));
            home.push(parseFloat(obj_resp.p[1]));
            console.log('home');
            console.log(home);
          }
          else if ((obj_resp.c == 'BO' || obj_resp.c == 'SO') && busy == false){
            x_o = parseFloat(obj_resp.p[0]);
            y_o = parseFloat(obj_resp.p[1]);
            id_ob = obj_resp.p[2];
          }
        }
      }
    });
    while (true) { 
      if ((n_agents != '0') && (id_agent != '0')){
        basic.pause(50);
        break; 
      }
      basic.pause(20); 
    }
    return;
  } 
  /**
  * serialize msg and send request to sandBox.
  */ 
  function sendMsg(d: string, c: string, p: string[], req: boolean, stop: number): boolean {
    let obj_req = new Resp();
    obj_req.set_values(id_agent, d, c, p);
    let msg = obj_req.f + obj_req.d + obj_req.c;
    let n_param = obj_req.p.length;
    let size = n_param;
    if (size > 0){ 
      for (let i = 0; i < n_param; i++)
        size += obj_req.p[i].length; 
      let num_fill = 14 - size;
      let n_each = num_fill / n_param;
      if (num_fill >= 0){
        if (n_param >= 1){
            for (let i = 0; i < n_param; i++){
              msg += obj_req.p[i] + '/';
              for(let j = 0; j < Math.floor(n_each); j++)
                msg += '0';
            }
        } 
        if ((n_each != Math.floor(n_each)) || (num_fill < n_param)){
          let ex = 18 - msg.length; 
          for (let i = 0; i < ex; i++)
            msg += '0';
        }
      } 
    }
    console.log('sent '+msg);
    radio.sendString(msg);
    if (req){
      let n_times = 250;
      waiting = true;
      for (let i = 0; i < n_times; i++){
        if (act_pos){
          act_pos = false;
          waiting = false;
          return true;
        }
        else{
          if (i == stop)
            stopcar();
          if (repeat){
            repeat = false;
            if (stop > 0)
              stopcar();
            let res = sendMsg(d, c, p, req, stop);
            return res;
          }
        } 
        basic.pause(50);
      }
      waiting = false;
      stopSearching();
      return false;
    }
    else 
      return true;
  }
  /**
  * indicates to Sandbox to stop sending current values due to timeout 
  */ 
  function stopSearching(){
    radio.sendString('SS');
    basic.pause(20);
  }
  /**
  * Adaptation of PID
  */ 
  function pid(p: number, min_prev: number, max_prev: number, min_new: number, max_new: number): number{
    let num = Math.round((p - min_prev) / (max_prev - min_prev) * (max_new - min_new) + min_new); 
    return num;
  }
  /**
  * Keep agents always on sand (avoid them to fall).
  */ 
  //% block="Always on sand"
  //% weight=198 color=#ff9da5
  export function onSand() {
    control.inBackground(() => {
      while (true) {
        if (tracking(TrackingState.L_R_line))
          stopcar();
        basic.pause(200); 
      }
    });
  }
  /**
  * Agents can know their number when initialized on SandBox.
  */ 
  //% block="My number (ID)"
  //% weight=195 color=#ff9da5
  export function myNumber(): number {
    let num = parseInt(id_agent);
    return num;
  }
  /**
  * Agents can know their position in cm on SandBox.
  */ 
  //% block="My position %pos (cm)"
  //% weight=190 color=#ff9da5
  export function myPosition(pos: Position): number { 
    if (sendMsg('0', 'GP', [], true, -1)){
      if(pos == Position.x)
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
  //% weight=185 color=#ff9da5
  export function myDirection(): number { 
    if (sendMsg('0', 'GP', [], true, -1))
      return theta;
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
  //% weight=180 color=#ff9da5
  export function rotate(p: number, dir: RotateDir) { 
    // request direction
    if (sendMsg('0', 'GP', [], true, -1)){
      let theta_p = 0;    let d = 0;
      if (dir == RotateDir.dir_right){
        theta_p = theta - p;
        if (theta_p < 0)
          theta_p = 360 + theta_p;
      }
      else{
        theta_p = theta + p;
        if (theta_p > 360)
          theta_p = theta_p - 360;
      }
      result_angle = theta_p;
      let p_aux = p;
      while (p > 4 && p <= p_aux){
        d = pid(p, 10, 180, 17, 18);
        if (dir == RotateDir.dir_right){
          motors(30, -35);
          basic.pause(70);
          motors(d, -d-3);
        }
        else{
          motors(-35, 30);
          basic.pause(70);
          motors(-d-3, d);
        } 
        if (sendMsg('0', 'GP', [], true, 0)){
          p_aux = p;
          p =  Math.abs(theta_p - theta); 
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
  * @param cm distance to move, eg: 30 
  */ 
  //% block="Move forward %cm centimeters"
  //% cm.min = 5 cm.max = 90
  //% weight=175 color=#ff9da5
  export function moveCm(cm: number): void { 
    if (sendMsg('0', 'GP', [], true, -1)){
      let aux = cm;  let v = 0;
      let xv = 0;    let yv = 0;
      let theta_o = theta; 
      let d_theta = 0;  let vc = 0;
      while ((cm > 1) && (cm <= aux)){
        xv = x; 
        yv = y;
        v = pid(cm, 5, 100, 20, 25);
        motors(v, v);  
        basic.pause(800);
        if (sendMsg('0', 'GP', [], true, 5)){
          cm = cm - Math.sqrt((x - xv) ** 2 + (y - yv) ** 2);
          d_theta = theta_o - theta;
          if (Math.abs(d_theta) > 300)
            d_theta = 360 + d_theta;
          if (d_theta != 0 && Math.abs(d_theta) > 1){
            vc = pid(Math.abs(d_theta), 2, 15, 6, 12);
            if (d_theta < 0)
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
  //function to get distance between 2 points
  function distance(x1: number, x2: number, y1: number, y2: number): number{
    let d = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    return Math.round(d);
  }
  // get degrees to radians
  function degrees2radians(angle: number): number{
    let radians = angle / 180 * Math.PI;
    return radians;
  }
  // get radians to degrees
  function radians2degrees(angle: number): number{
    let degrees = angle * 180 / Math.PI;
    return degrees;
  }
  // transform center to get rotation angle
  function rotationAngle(xa: number, xb: number, ya: number, yb: number, angle_a: number, d: number): number{
    let angle = -1 * degrees2radians(angle_a);
    let xt = ((xb - xa) * Math.cos(angle)) - ((yb - ya) * Math.sin(angle));
    let yt = ((xb - xa) * Math.sin(angle)) + ((yb - ya) * Math.cos(angle));
    angle = Math.asin(yt / d);
    angle = radians2degrees(angle);
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
  //% weight=170 color=#ff9da5
  export function goToPoint(px: number, py: number, space = 0) {
    if (sendMsg('0', 'GP', [], true, -1)){
      let d = distance(px, x, py, y);
      let d_theta = 0;
      let v = 0;
      let vc = 0;
      let aux = 999;
      let angle = rotationAngle(x, px, y, py, theta, d);
      if (angle > 7){
        if (angle > 180){
          angle = 360 - angle; 
          rotate(angle, RotateDir.dir_right);
        }
        else 
          rotate(angle, RotateDir.dir_left); 
      }
      else
        result_angle = theta;
      while (d > (4 + space) && d <= aux){
        if (sendMsg('0', 'GP', [], true, 4)){
          aux = d;
          d_theta = result_angle - theta;
          if (Math.abs(d_theta) > 300)
            d_theta = 360 + d_theta;
          if (d_theta != 0 && Math.abs(d_theta) > 1){
            vc = pid(Math.abs(d_theta), 2, 30, 6, 15);
            if (d_theta < 0)
              motors(v + vc, v - vc);
            else
              motors(v - vc, v + vc);
            basic.pause(50);
          }
          v = pid(d, 5, 100, 20, 25);
          motors(v, v);  
          d = distance(px, x, py, y);
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
  //% weight=188 color=#ff9da5
  export function wander(){

  }
  /**
  * Agents can look for objects and take them home
  */ 
  //% block="Look for objects"
  //% weight=188 color=#ff9da5
  export function lookForSth(){

  }
  /**
  * Agents can know how many agents are initialized on SandBox.
  */ 
  //% block="Number of agents on SandBox"
  //% weight=170 color=#ff9da5
  export function numberOfAgents(): number {
    let num = parseInt(n_agents);
    return num;
  }
/**
 * TODO: On all agents initialized on SandBox.
 */
  //% weight=165 color=#ff9da5
  //% block="On all agents initialized"
  export function Init_callback(handler: () => void) {
    control.onEvent(99, 3501, handler);
    control.inBackground(() => {
      while (true) { 
        if (n_agents != '0')
          control.raiseEvent(99, 3501, EventCreationMode.CreateAndFire); 
        basic.pause(20); 
      }
    });
    return;
  }
  /**
 * Agent is able to know which agent(s) are around or near itself.
 * @param d distance between agents, eg: 45
 */
  //% weight=160 color=#ff9da5
  //% block="Who are at least %d cm near me?"
  //% d.min = 12 d.max = 100
  // export function nearMe(d: number): string { 
  //   if (sendMsg('0', 'WN', [d.toString()], true, -1))
  //     return near_me;
  //   else
  //     return '0'
  // }
/**
 * TODO: An agent can aks for other agent's help when needed
 */
  //% weight=145 color=#ff9da5
  //% block="Ask for other agent's help "
  //% id.min = 1 id.max = 3
  export function askHelp() {
    if (parseInt(n_agents) > 1){
      sendMsg('0', 'CA', ['F'], false, -1);
      while (true){
        if (arrived != '')
          break
        basic.pause(20);
      }
    }
    else 
      basic.showString('Could not ask 4 help');
    return;
  }
  /**
 * TODO: On an agent calling me
 */
  //% weight=140 color=#ff9da5
  //% block="On an agent calling me"
  export function calledByAgent(handler: () => void) {
    control.onEvent(100, 3502, handler);
    control.inBackground(() => {
      while (true) { 
        if (called){
          control.raiseEvent(100, 3502, EventCreationMode.CreateAndFire); 
          called = false;
        }
        basic.pause(20); 
      }
    });
    return;
  }
/**
 * TODO: Go where the leader is
 */
  //% weight=135 color=#ff9da5
  //% block="Go to the leader"
  export function goToLeader() {
    if (calls != ''){
      if (sendMsg('0', 'GP', [calls], true, -1)){
        goToPoint(x, y, 20);
        sendMsg('0', 'AR', [calls], false, -1);
      }
      else 
        return;
    }
    return;
  }
  /**
 * TODO: On 'follow me' received, previously called.
 */
  //% weight=140 color=#ff9da5
  //% block="On 'follow me' received"
  export function askedToFollow(handler: () => void) {
    control.onEvent(101, 3503, handler);
    control.inBackground(() => {
      while (true) { 
        if (follow_req){
          control.raiseEvent(101, 3503, EventCreationMode.CreateAndFire); 
          follow_req = false;
        }
        basic.pause(20); 
      }
    });
    return;
  }
  /**
 * TODO: Indicates to an agent previously called to follow it.
 */
  //% weight=130 color=#ff9da5
  //% block="Follow me"
  export function followMe() {
    if (arrived != ''){
      sendMsg('0', 'FM', [arrived], false, -1);
      basic.pause(5000);
    }
    else
      basic.showString('Ask for help first');
    return;
  }
  /**
 * TODO: Follow the leader who called it.
 */
  //% weight=130 color=#ff9da5
  //% block="Follow leader"
  export function followLeader() {
    if (id2follow != ''){
      if (sendMsg('0', 'GP', [id2follow], true, -1)){
        let af = theta;
        if (sendMsg('0', 'GP', [], true, -1)){
          let aa = theta;
          let angle = Math.abs(af - aa);
          if (af > aa){
            if(angle > 180){
              angle = 360 - angle;
              rotate(angle, RotateDir.dir_right);
            }
            else
              rotate(angle, RotateDir.dir_left);
          }
          else if (aa > af){
            if (angle > 180){
              angle = 360 - angle;
              rotate(angle, RotateDir.dir_left);
            }
            else
              rotate(angle, RotateDir.dir_right);
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
  /**
   * TODO: Set the speed of left and right wheels.
   * @param lspeed Left wheel speed , eg: 100
   * @param rspeed Right wheel speed, eg: -100
   */
  //% blockId=MotorRun block="Set left wheel speed %lspeed\\% |right wheel speed %rspeed\\%"
  //% lspeed.min=-100 lspeed.max=100
  //% rspeed.min=-100 rspeed.max=100
  //% weight=100
  export function motors(lspeed: number = 50, rspeed: number = 50): void {
    let buf = pins.createBuffer(4);
    if (lspeed > 100) {
      lspeed = 100;
    } else if (lspeed < -100) {
      lspeed = -100;
    }
    if (rspeed > 100) {
      rspeed = 100;
    } else if (rspeed < -100) {
      rspeed = -100;
    }
    if (lspeed > 0) {
      buf[0] = 0x01; //左右轮 0x01左轮  0x02右轮
      buf[1] = 0x02; //正反转0x02前进  0x01后退
      buf[2] = lspeed; //速度
      buf[3] = 0; //补位
      pins.i2cWriteBuffer(STM8_ADDRESSS, buf); //写入左轮
    } else {
      buf[0] = 0x01;
      buf[1] = 0x01;
      buf[2] = lspeed * -1;
      buf[3] = 0; //补位
      pins.i2cWriteBuffer(STM8_ADDRESSS, buf); //写入左轮
    }
    if (rspeed > 0) {
      buf[0] = 0x02;
      buf[1] = 0x02;
      buf[2] = rspeed;
      buf[3] = 0; //补位
      pins.i2cWriteBuffer(STM8_ADDRESSS, buf); //写入左轮
    } else {
      buf[0] = 0x02;
      buf[1] = 0x01;
      buf[2] = rspeed * -1;
      buf[3] = 0; //补位
      pins.i2cWriteBuffer(STM8_ADDRESSS, buf); //写入左轮
    }
  }
  /**
   * TODO: Full speed operation lasts for 10 seconds,speed is 100.
   * @param dir Driving direction, eg: Direction.forward
   * @param speed Running speed, eg: 50
   * @param time Travel time, eg: 5
   */
  //% blockId=ucaBot_move_time block="Go %dir at speed%speed\\% for %time seconds"
  //% weight=95
  export function moveTime(dir: Direction, speed: number, time: number): void {
    if (dir == 0) {
      motors(speed, speed);
      basic.pause(time * 1000);
      motors(0, 0);
    }
    if (dir == 1) {
      motors(-speed, -speed);
      basic.pause(time * 1000);
      motors(0, 0);
    }
    if (dir == 2) {
      motors(-speed, speed);
      basic.pause(time * 1000);
      motors(0, 0);
    }
    if (dir == 3) {
      motors(speed, -speed);
      basic.pause(time * 1000);
      motors(0, 0);
    }
  }
  /**
   * TODO: full speed move forward,speed is 100.
   */
  //% blockId=ucaBot_forward block="Go straight at full speed"
  //% weight=90
  export function forward(): void {
    // Add code here
    let buf = pins.createBuffer(4);
    buf[0] = 0x01;
    buf[1] = 0x02;
    buf[2] = 80;
    buf[3] = 0;
    pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
    buf[0] = 0x02;
    pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
  }

  /**
   * TODO: full speed move back,speed is -100.
   */
  //% blockId=ucaBot_back block="Reverse at full speed"
  //% weight=85
  export function backforward(): void {
    // Add code here
    let buf = pins.createBuffer(4);
    buf[0] = 0x01;
    buf[1] = 0x01;
    buf[2] = 80;
    buf[3] = 0;
    pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
    buf[0] = 0x02;
    pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
  }
  /**
   * TODO: full speed turnleft.
   */
  //% blockId=ucaBot_left block="Turn left at full speed"
  //% weight=80
  export function turnleft(): void {
    // Add code here
    let buf = pins.createBuffer(4);
    buf[0] = 0x02;
    buf[1] = 0x02;
    buf[2] = 80;
    buf[3] = 0;
    pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
    buf[0] = 0x01;
    buf[2] = 0;
    pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
  }
  /**
   * TODO: full speed turnright.
   */
  //% blockId=ucaBot_right block="Turn right at full speed"
  //% weight=75
  export function turnright(): void {
    // Add code here
    let buf = pins.createBuffer(4);
    buf[0] = 0x01;
    buf[1] = 0x02;
    buf[2] = 80;
    buf[3] = 0;
    pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
    buf[0] = 0x02;
    buf[2] = 0;
    pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
  }
  /**
   * TODO: stopcar
   */
  //% blockId=ucaBot_stopcar block="Stop car immediatly"
  //% weight=70
  export function stopcar(): void {
    motors(0, 0);
  }
  /**
   * TODO: Set LED headlights.
   */
  //% block="Set LED headlights %light color $color"
  //% color.shadow="colorNumberPicker"
  //% weight=65
  export function colorLight(light: RGBLights, color: number) {
    let r: number,
      g: number,
      b: number = 0;
    r = color >> 16;
    g = (color >> 8) & 0xff;
    b = color & 0xff;
    singleheadlights(light, r, g, b);
  }
  /**
   * TODO: Select a headlights and set the RGB color.
   * @param R R color value of RGB color, eg: 0
   * @param G G color value of RGB color, eg: 128
   * @param B B color value of RGB color, eg: 255
   */
  //% inlineInputMode=inline
  //% blockId=RGB block="Set LED headlights %light color R:%r G:%g B:%b"
  //% r.min=0 r.max=255
  //% g.min=0 g.max=255
  //% b.min=0 b.max=255
  //% weight=60
  export function singleheadlights(
    light: RGBLights,
    r: number,
    g: number,
    b: number
  ): void {
    let buf = pins.createBuffer(4);
    if (light == 3) {
      buf[0] = 0x04;
      buf[1] = r;
      buf[2] = g;
      buf[3] = b;
      pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
      buf[0] = 0x08;
      pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
    } else {
      if (light == 0) {
        buf[0] = 0x04;
      }
      if (light == 1) {
        buf[0] = 0x08;
      }
      buf[1] = r;
      buf[2] = g;
      buf[3] = b;
      pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
    }
  }
  /**
   * Close all headlights.
   */
  //% inlineInputMode=inline
  //% block="Turn off all LED headlights"
  //% weight=55
  export function closeheadlights(): void {
    let buf = pins.createBuffer(4);
    buf[0] = 0x04;
    buf[1] = 0;
    buf[2] = 0;
    buf[3] = 0;
    pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
    buf[0] = 0x08;
    pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
  }

  /**
   * Judging the Current Status of Tracking Module.
   * @param state Four states of tracking module, eg: TrackingState.L_R_line
   */
  //% blockId=ringbitcar_tracking block="Tracking state is %state"
  //% weight=50
  export function tracking(state: TrackingState): boolean {
    pins.setPull(DigitalPin.P13, PinPullMode.PullNone);
    pins.setPull(DigitalPin.P14, PinPullMode.PullNone);
    let left_tracking = pins.digitalReadPin(DigitalPin.P13);
    let right_tracking = pins.digitalReadPin(DigitalPin.P14);
    if (left_tracking == 0 && right_tracking == 0 && state == 0) {
      return true;
    } else if (left_tracking == 1 && right_tracking == 0 && state == 1) {
      return true;
    } else if (left_tracking == 0 && right_tracking == 1 && state == 2) {
      return true;
    } else if (left_tracking == 1 && right_tracking == 1 && state == 3) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * TODO: track one side
   * @param side Line sensor edge , eg: MbPins.Left
   * @param state Line sensor status, eg: MbEvents.FindLine
   */
  //% block="%side line sensor %state"
  //% state.fieldEditor="gridpicker" state.fieldOptions.columns=2
  //% side.fieldEditor="gridpicker" side.fieldOptions.columns=2
  //% weight=45
  export function trackSide(side: MbPins, state: MbEvents): boolean {
    pins.setPull(DigitalPin.P13, PinPullMode.PullNone);
    pins.setPull(DigitalPin.P14, PinPullMode.PullNone);
    let left_tracking = pins.digitalReadPin(DigitalPin.P13);
    let right_tracking = pins.digitalReadPin(DigitalPin.P14);
    if (side == 0 && state == 1 && left_tracking == 1) {
      return true;
    } else if (side == 0 && state == 0 && left_tracking == 0) {
      return true;
    } else if (side == 1 && state == 1 && right_tracking == 1) {
      return true;
    } else if (side == 1 && state == 0 && right_tracking == 0) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * TODO: Runs when line sensor finds or loses.
   */
  //% block="On %sensor| line %event"
  //% sensor.fieldEditor="gridpicker" sensor.fieldOptions.columns=2
  //% event.fieldEditor="gridpicker" event.fieldOptions.columns=2
  //% weight=40
  export function trackEvent(sensor: MbPins, event: MbEvents, handler: Action) {
    initEvents();
    control.onEvent(<number>sensor, <number>event, handler);
  }
  /**
   * Cars can extend the ultrasonic function to prevent collisions and other functions..
   * @param Sonarunit two states of ultrasonic module, eg: Centimeters
   */
  //% blockId=ultrasonic block="HC-SR04 Sonar unit %unit"
  //% weight=35
  export function ultrasonic(unit: SonarUnit, maxCmDistance = 500): number {
    // send pulse
    pins.setPull(DigitalPin.P8, PinPullMode.PullNone);
    pins.digitalWritePin(DigitalPin.P8, 0);
    control.waitMicros(2);
    pins.digitalWritePin(DigitalPin.P8, 1);
    control.waitMicros(10);
    pins.digitalWritePin(DigitalPin.P8, 0);
    // read pulse
    const d = pins.pulseIn(DigitalPin.P12, PulseValue.High, maxCmDistance * 50);
    switch (unit) {
      case SonarUnit.Centimeters:
        return Math.floor((d * 34) / 2 / 1000);
      case SonarUnit.Inches:
        return Math.floor(((d * 34) / 2 / 1000) * 0.3937);
      default:
        return d;
    }
  }
  /**
   * TODO: Set the angle of servo.
   * @param Servo ServoList , eg: ucaBot.ServoList.S1
   * @param angle angle of servo, eg: 90
   */
  //% blockId=ucaBot_servo block="Set servo %servo angle to %angle °"
  //% angle.shadow="protractorPicker"
  //% weight=30
  export function setServo(Servo: ServoList, angle: number = 180): void {
    let buf = pins.createBuffer(4);
    if (Servo == ServoList.S1) {
      buf[0] = 0x05;
      buf[1] = angle;
      buf[2] = 0;
      buf[3] = 0; //补位
      pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
    } else {
      buf[0] = 0x06;
      buf[1] = angle;
      buf[2] = 0;
      buf[3] = 0; //补位
      pins.i2cWriteBuffer(STM8_ADDRESSS, buf);
    }
  }
  //% shim=IRV2::irCode
  function irCode(): number {
    return 0;
  }
  //% weight=25
  //% block="On IR receiving"
  export function IR_callback(handler: () => void) {
    pins.setPull(DigitalPin.P16, PinPullMode.PullUp);
    control.onEvent(98, 3500, handler);
    control.inBackground(() => {
      while (true) {
        IR_Val = irCode();
        if (IR_Val != 0xff00) {
          control.raiseEvent(98, 3500, EventCreationMode.CreateAndFire);
        }
        basic.pause(20);
      }
    });
  }
  /**
   * TODO: Get IR value
   */
  //% block="IR Button %Button is pressed"
  //% weight=15
  export function IR_Button(Button: IRButtons): boolean {
    return (IR_Val & 0x00ff) == Button;
  }
  function initEvents(): void {
    if (_initEvents) {
      pins.setEvents(DigitalPin.P13, PinEventType.Edge);
      pins.setEvents(DigitalPin.P14, PinEventType.Edge);
      _initEvents = false;
    }
  }
}

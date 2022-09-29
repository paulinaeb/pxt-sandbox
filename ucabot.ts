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
  let obj_req = new Resp();
  let id_agent = '0';
  let n_agents = '0';
  let x = 0;
  let y = 0;
  let act_pos = false;
  let act_dir = false;
  let theta = 0;
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
   * TODO: Initialize agent with color and Id.
   */
  //% block="Initialize agent on Sandbox"
  //% weight=200 color=#ff9da5
  export function initAgent(): void {
    radio.setGroup(ID_GROUP);
    radio.onReceivedString(function (receivedString) {
      // msg in fixed format
      let msg = receivedString;
      console.log('received '+msg);  
      // assign header of msg to public object
      obj_resp.set_header(msg[0], msg[1], msg[2]+msg[3]);
      // if the msg is for me or for all, search the params
      if ((obj_resp.d == 'F') || (obj_resp.d == id_agent)){
        // if there are params
        if (msg.length > 4){
          // assign str for params (excludes header) 
          let str_p = msg.slice(4);
          // occurrences of '/' in str
          let limit = (str_p.split("/").length - 1); 
          // has params
          if (limit > 0){
            // insert params into array
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
                // checks if num or str for every char 
                if (!(((obj_resp.p[i][char] >= '0') && (obj_resp.p[i][char] <= '9')) || (obj_resp.p[i][char]=='.')))
                    // increments str flag
                  flag+=1; 
              }
              // if the param is a str - remove 0
              if (flag > 0)
                obj_resp.p[i] = obj_resp.p[i].replace('0',''); 
            }
          }
        }
        console.log(obj_resp.f+' '+obj_resp.d+' '+obj_resp.c);
        console.log(obj_resp.p);
        // if msg comes from sand
        if ((obj_resp.f == '0')){
          if ((id_agent == '0') && (obj_resp.c == 'II')){
            id_agent = obj_resp.p[0];
            basic.showString(id_agent);
            basic.pause(1800);
            basic.clearScreen();
          }
          else if ((n_agents == '0') && (obj_resp.c == 'AI')){
            n_agents = obj_resp.p[0];
          }
          else if (obj_resp.c == 'GP'){
            x = parseFloat(obj_resp.p[0]);
            y = parseFloat(obj_resp.p[1]);
            act_pos = true;
          }
          else if (obj_resp.c == 'GD'){
            theta = parseFloat(obj_resp.p[0]);
            act_dir = true;
          }
        }
        // if msg comes from other agent
        else{}
      }
    });
// the block does not end until agents are initialized
    while (true) { 
      if ((n_agents != '0') && (id_agent != '0'))
        break; 
      basic.pause(20); 
    }
    basic.showString('Ready');
    return;
  }
  /**
 * TODO: On all agents initialized on SandBox.
 */
  //% weight=195 color=#ff9da5
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
  * Agents can know how many agents are initialized on SandBox.
  */ 
  //% block="Number of agents on SandBox"
  //% weight=190 color=#ff9da5
  export function numberOfAgents(): number {
    // parse result - only valid if agents were initialized correctly
    let num = parseInt(n_agents);
    return num;
  }
  /**
  * Agents can know their number when initialized on SandBox.
  */ 
  //% block="My number"
  //% weight=185 color=#ff9da5
  export function myNumber(): number {
    // parse result - only valid if agent was initialized correctly
    let num = parseInt(id_agent);
    return num;
  }

  basic.forever(function(){ 
      if (obj_req.f != null){
        console.log('there is a request to send');
        console.log(obj_req.f+' '+obj_req.d+' '+obj_req.c+' '+obj_req.p);
        // header of msg
        let msg = obj_req.f + obj_req.d + obj_req.c;
        // num of params passed
        let n_param = obj_req.p.length;
        // size of params str with delimiter (/)
        let size = n_param;
        // if there are params
        if (size > 0){ 
          // adds the size of each param
          for (let i = 0; i < n_param; i++)
            size += obj_req.p[i].length; 
          // define the number of spaces to be filled with '0'
          let num_fill = 14 - size;
          // number of spaces that every param will have added to (if>0)
          let n_each = num_fill / n_param;
          if (num_fill >= 0){
            if (n_param >= 1){
                for (let i = 0; i < n_param; i++){
                  msg += obj_req.p[i] + '/';
                  for(let j = 0; j < Math.floor(n_each); j++)
                    msg += '0';
                }
            } 
            // if num to add is odd or there are less spaces to be filled than params 
            if ((n_each != Math.floor(n_each)) || (num_fill < n_param)){
              let ex = 18 - msg.length; 
              for (let i = 0; i < ex; i++)
                msg += '0';
            }
          } 
          else
            console.log('The number of chars you tried to pass in parameters overload the allowed (14). Verify and try again.'); 
      }
      console.log('serialized: '+msg);
      radio.sendString(msg);
      console.log('sent');
      obj_req = new Resp();
    } 
  });
  /**
  * Agents can know their position in cm on SandBox.
  */ 
  //% block="My position %pos (cm)"
  //% weight=180 color=#ff9da5
  export function myPosition(pos: Position): number { 
    // request pos
    obj_req.set_values(id_agent, '0', 'GP', []); 
    while (true){
      if (act_pos == true)
        break;
      basic.pause(20);
    }
    act_pos = false; 
    if(pos == Position.x)
      return x;
    else
      return y;
  }
  /**
  * Agents can know their direction in degrees on SandBox.
  */ 
  //% block="My direction"
  //% weight=175 color=#ff9da5
  export function myDirection(): number { 
    // request direction
    obj_req.set_values(id_agent, '0', 'GD', []); 
    while (true){
      if (act_dir == true)
        break;
      basic.pause(20);
    }
    act_dir = false;
    return theta;
  }
  /**
  * Agents can know their direction in degrees on SandBox.
  */ 
  //% block="Rotate agent %p ° to %dir"
  //% weight=175 color=#ff9da5
  export function rotate(p: number, dir: RotateDir) { 
    // request direction
    obj_req.set_values(id_agent, '0', 'GD', []); 
    while (true){
      if (act_dir == true)
        break;
      basic.pause(20);
    }
    act_dir = false;
    console.log('theta '+theta);
    let theta_p = 0;
    let d = 0;
    let min_prev = 5;
    let max_prev = 180;
    let min_new = 24;
    let max_new = 32;
    if (dir == RotateDir.dir_right)
      theta_p = theta + p;
    else
      theta_p = theta - p;
    console.log('new angle' + theta_p);
    let e = Math.abs(theta - theta_p);
    console.log('error '+e); 
    while(e > 2){
    //PID adaptation
      d = Math.round((e - min_prev) / (max_prev - min_prev) * (max_new - min_new) + min_new);
      if (d < 30){
        motors(30, -30);
        basic.pause(100);
        console.log('menor a 30');
      }
      motors(d, -d);
      obj_req.set_values(id_agent, '0', 'GD', []); 
      while (true){
        if (act_dir)
          break;
        basic.pause(20);
      }
      act_dir = false;
      console.log('theta in loop'+theta);
      e = Math.abs(theta - theta_p);
      console.log('error in loop '+e); 
    }
    motors(0,0);
    console.log('end');
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

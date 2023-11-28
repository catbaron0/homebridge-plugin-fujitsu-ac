import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { FujitsuAC } from './platform';
import axios from 'axios';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class FujitsuACAccessory {
  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private isActive = false;
  private tempe = 0.0;
  constructor(
    private readonly platform: FujitsuAC,
    private readonly accessory: PlatformAccessory,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    // get the HeaterCooler service if it exists, otherwise create a new HeaterCooler service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.HeaterCooler) || this.accessory.addService(this.platform.Service.HeaterCooler);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/HeaterCooler

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.Active)
      .onSet(this.handleActiveSet.bind(this))
      .onGet(this.handleActiveGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.CurrentHeaterCoolerState)
      .onGet(this.handleCurrentHeaterCoolerStateGet.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetHeaterCoolerState)
      .onGet(this.handleTargetHeaterCoolerStateGet.bind(this))
      .onSet(this.handleTargetHeaterCoolerStateSet.bind(this));

    // this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
    //   .onGet(this.handleCurrentTemperatureGet.bind(this));

    setInterval(() => {

      const api_url = this.platform.config.api_url + '/sensors/tphb';
      this.platform.log.info('Reading sensors from:' + api_url);

      axios.get(api_url)
        .then((res) => {
          const data = res.data;
          this.service.updateCharacteristic(this.platform.Characteristic.CurrentTemperature, data.tempe);
        })
        .catch((error) => {
          this.platform.log.error(error);
        });
    }, 10000);
  }

  async updateTempe() {
    const api_url = this.platform.config.api_url + '/sensors/tphb';
    this.platform.log.info('API:' + api_url);
    axios.get(api_url)
      .then((res) => {
        const data = res.data;
        this.platform.log.info(res.data);
        this.tempe = data.tempe;
      })
      .catch((error) => {
        this.platform.log.error(error);
      });
  }

  async acApi(arg: string) {
    const api_url = this.platform.config.api_url + '/ac/' + arg;
    this.platform.log.info('API:' + api_url);
    axios.get(api_url)
      .then((res) => {
        this.platform.log.info(res.data);
      });
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async handleActiveSet(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    this.updateTempe();
    this.isActive = value as boolean;
    if (this.isActive) {
      this.acApi('on');
    } else {
      this.acApi('off');
    }
    this.platform.log.debug('Set Characteristic On ->', value);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async handleActiveGet(): Promise<CharacteristicValue> {
    // implement your own code to check if the device is on
    const activeState = this.isActive;

    this.platform.log.debug('Get Characteristic activeState ->', activeState);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return activeState;
  }

  /**
   * Handle requests to get the current value of the "Current Heater-Cooler State" characteristic
   */
  async handleCurrentHeaterCoolerStateGet() {
    this.platform.log.debug('Triggered GET CurrentHeaterCoolerState');

    // set this to a valid value for CurrentHeaterCoolerState
    const currentValue = this.platform.Characteristic.CurrentHeaterCoolerState.INACTIVE;
    return currentValue;
  }


  /**
   * Handle requests to get the current value of the "Target Heater-Cooler State" characteristic
   */
  async handleTargetHeaterCoolerStateGet() {
    this.platform.log.debug('Triggered GET TargetHeaterCoolerState');

    // set this to a valid value for TargetHeaterCoolerState
    const currentValue = this.platform.Characteristic.TargetHeaterCoolerState.AUTO;
    return currentValue;
  }

  /**
   * Handle requests to set the "Target Heater-Cooler State" characteristic
   */
  async handleTargetHeaterCoolerStateSet(value) {
    this.platform.log.debug('Triggered SET TargetHeaterCoolerState:', value);
  }

  /**
   * Handle requests to get the current value of the "Current Temperature" characteristic
   */
  // async handleCurrentTemperatureGet() {
  //   this.platform.log.debug('Triggered GET CurrentTemperature');

  //   // set this to a valid value for CurrentTemperature
  //   await this.updateTempe();
  //   return this.tempe;

  // }


}

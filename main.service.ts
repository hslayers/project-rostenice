import {HsSidebarService} from 'hslayers-ng/components/sidebar/sidebar.service';
import {HsPanelContainerService} from 'hslayers-ng/components/layout/panels/panel-container.service';
import { WeatherComponent } from './weather.component';
import {Injectable, Type} from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class MainService {
  constructor(private HsSidebarService: HsSidebarService, private HsPanelContainerService: HsPanelContainerService) {

  }

  init(){
    this.HsSidebarService.buttons.push({ panel: 'weather', module: 'hs.weather', order: 10, title: 'Weather watcher', description: 'Get weather satellite crossings', icon: 'icon-time' })
    this.HsPanelContainerService.create(WeatherComponent,{});
  }
}

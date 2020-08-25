import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, ChartData } from 'chart.js';
import * as dayjs from 'dayjs';
import { last, map as _map, orderBy } from 'lodash'
import { DataPoint, Status } from '../../model/data-point';
import { DataService } from '../../service/data.service';
import { UserService } from '../../service/user.service';

declare var BMap: any;
declare var BMapLib: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  dataPoints: DataPoint[] = [];

  @ViewChild('groupByAgeChartElement', { static: false }) groupByAgeChartElement: ElementRef;
  @ViewChild('groupByCityChartElement', { static: false }) groupByCityChartElement: ElementRef;
  @ViewChild('groupByDateChartElement', { static: false }) groupByDateChartElement: ElementRef;
  @ViewChild('newConfirmedChartElement', { static: false }) activeAndConfirmedChartElement: ElementRef;
  groupByAgeChart: Chart;
  groupByCityChart: Chart;
  groupByDateChart: Chart;
  activeAndConfirmedChart: Chart;
  map;
  username;

  constructor(private dataService: DataService, private userService: UserService, private router: Router, private changeDetectorRef: ChangeDetectorRef) {
    if(!this.userService.token) {
      this.router.navigate(['auth'])
    }
  }

  ngOnInit() {
    this.username = this.userService.username;
    this.map = new BMap.Map('baidu-map', {});
    this.map.centerAndZoom(new BMap.Point(114.271, 30.631), 11);
    this.map.setCurrentCity('武汉');
    this.map.enableScrollWheelZoom(true);

    this.dataService.loadData();

    this.dataService.dataPoints.subscribe(dataPoints => {
      this.dataPoints = dataPoints;
      this.drawByAgeChart();
      this.drawByCityChart();
      this.drawByDateChart();
      this.drawNewConfirmedChart();

      this.drawMap();
    });
  }

  drawMap() {
    var markers = [];
    const points = this.dataPoints.map(dataPoint => {
      let point = new BMap.Point(Number(dataPoint.longitude), Number(dataPoint.latitude))
      markers.push(new BMap.Marker(point));
      return point;
    })
    const markerClusterer = new BMapLib.MarkerClusterer(this.map, { markers: markers });
    this.changeDetectorRef.detectChanges();
  }

  logout() {
    this.userService.logout().subscribe((res: { message: string }) => {
      if (res.message === 'logOut success') {
        this.userService.username = null;
        this.userService.token = null;
        this.router.navigate(['auth']);
      }
    })
  }

  get totalConfirmed() {
    return this.dataPoints.filter(dataPoint => dataPoint.status !== Status.suspected)
  }

  get activeCase() {
    return this.dataPoints.filter(dataPoint => dataPoint.status === Status.confirmed)
  }

  get recovered() {
    return this.dataPoints.filter(dataPoint => dataPoint.status === Status.cured)
  }

  get deaths() {
    return this.dataPoints.filter(dataPoint => dataPoint.status === Status.death)
  }

  get suspected() {
    return this.dataPoints.filter(dataPoint => dataPoint.status === Status.suspected)
  }

  get groupByAge(): ChartData {
    const groupedByAge = this.dataPoints.reduce((previous, current, index) => {
      if (current.age <= 19) {
        previous['0~19']++;
      } else if (20 <= current.age && current.age <= 29) {
        previous['20~29']++;
      } else if (30 <= current.age && current.age <= 39) {
        previous['30~39']++;
      } else if (40 <= current.age && current.age <= 49) {
        previous['40~49']++;
      } else if (50 <= current.age && current.age <= 59) {
        previous['50~59']++;
      } else if (60 <= current.age && current.age <= 69) {
        previous['60~69']++;
      } else if (70 <= current.age && current.age <= 79) {
        previous['70~79']++;
      } else if (80 <= current.age) {
        previous['80+']++;
      } else {
        if (!previous['unknown']) {
          previous['unknown'] = 1;
        } else {
          previous['unknown']++;
        }
      }
      return previous;
    }, {
      '0~19': 0,
      '20~29': 0,
      '30~39': 0,
      '40~49': 0,
      '50~59': 0,
      '60~69': 0,
      '70~79': 0,
      '80+': 0
    });

    return {
      labels: Object.keys(groupedByAge),
      datasets: [
        {
          data: Object.values(groupedByAge),
          backgroundColor: 'rgb(255, 168, 96)'
        }
      ]
    }
  }

  get groupByCity() {
    const groupedData = this.dataPoints.reduce((previous, current, index) => {
      if (previous[current.city]) {
        previous[current.city]++;
      } else {
        previous[current.city] = 1;
      }
      return previous;
    }, {});
    const unsorted = _map(groupedData, (value, key) => {
      return { value, city: key }
    });
    const sorted = orderBy(unsorted, ['value'], ['desc']);

    return {
      labels: sorted.map(d => d.city),
      datasets: [
        {
          data: sorted.map(d => d.value),
          backgroundColor: 'rgb(48, 144, 192)'
        }
      ]
    }
  }

  get accumulateByDate() {
    const unsorted = _map(this.groupByDate, (value, key) => {
      return { value, date: dayjs(key).format('MM/DD') }
    })
    const sorted = orderBy(unsorted, ['date'], ['asc']);
    const datasetsByStatus = {
      confirmed: [],
      death: [],
      cured: []
    }
    sorted.forEach((data, index) => {
      const confirmed = data.value.confirmed ? data.value.confirmed : 0;
      const death = data.value.death ? -data.value.death : 0;
      const cured = data.value.cured ? -data.value.cured : 0;

      datasetsByStatus.confirmed.push(index === 0 ? confirmed : confirmed + last(datasetsByStatus.confirmed));
      datasetsByStatus.death.push(index === 0 ? death : death + last(datasetsByStatus.death));
      datasetsByStatus.cured.push(index === 0 ? cured : cured + last(datasetsByStatus.cured));
    });
    return {
      labels: sorted.map(d => d.date),
      datasets: [
        {
          type: 'bar',
          label: 'Active',
          backgroundColor: 'red',
          data: datasetsByStatus.confirmed
        },
        {
          type: 'bar',
          label: 'Cured',
          backgroundColor: 'green',
          data: datasetsByStatus.cured
        },
        {
          type: 'bar',
          label: 'Death',
          backgroundColor: 'black',
          data: datasetsByStatus.death
        },
      ]
    }
  }

  get groupByDate() {
    return this.dataPoints.reduce((previous, current, index) => {
      const confirmedDate = current.confirmed_date ? current.confirmed_date.split(' ')[0] : 'unknown';

      if (confirmedDate === 'unknown') {
        return previous;
      }

      const status = current.status;

      if (previous[confirmedDate]) {
        if (previous[confirmedDate][status]) {
          previous[confirmedDate][status]++;
        } else {
          previous[confirmedDate][status] = 1
        }
      } else {
        previous[confirmedDate] = {
          [status]: 1
        }
      }
      return previous;
    }, {});
  }

  get confirmedByDate() {
    let groupedData = this.totalConfirmed.reduce((previous, current, index) => {
      const confirmedDate = current.confirmed_date ? current.confirmed_date.split(' ')[0] : 'unknown';

      if (confirmedDate === 'unknown') {
        return previous;
      }

      if (previous[confirmedDate]) {
        previous[confirmedDate]++;
      } else {
        previous[confirmedDate] = 1;
      }
      return previous;
    }, {});

    return {
      labels: Object.keys(groupedData),
      datasets: [
        {
          backgroundColor: 'green',
          data: Object.values(groupedData)
        }
      ]
    }
  }

  private drawByAgeChart() {
    this.groupByAgeChart = new Chart(
      this.groupByAgeChartElement.nativeElement.getContext('2d'),
      {
        type: 'horizontalBar',
        data: this.groupByAge,
        options: {
          responsive: true,
          legend: {
            display: false,
            position: 'right',
          },
        }
      });
  }

  private drawByCityChart() {
    this.groupByCityChart = new Chart(
      this.groupByCityChartElement.nativeElement.getContext('2d'),
      {
        type: 'horizontalBar',
        data: this.groupByCity,
        options: {
          responsive: true,
          legend: {
            display: false,
            position: 'right',
          },
        }
      });
  }

  private drawByDateChart() {
    this.groupByDateChart = new Chart(
      this.groupByDateChartElement.nativeElement.getContext('2d'),
      {
        type: 'bar',
        data: this.accumulateByDate,
        options: {
          responsive: true,
          legend: {
            display: false,
            position: 'right',
          },
          scales: {
            xAxes: [{
              stacked: true,
              ticks: {
                autoSkip: true,
                maxTicksLimit: 15,
              }
            }],
            yAxes: [{
              stacked: true,
              ticks: {
                callback(value: number | string) {
                  if (typeof value === 'number') {
                    return Math.abs(value);
                  }
                }
              }
            }]
          },
          tooltips: {
            callbacks: {
              label: function (t, d) {
                const datasetLabel = d.datasets[t.datasetIndex].label;
                const yLabel = typeof t.yLabel === 'number' ? Math.abs(t.yLabel) : t.yLabel;
                return datasetLabel + ': ' + yLabel;
              }
            }
          }
        }
      });
  }

  private drawNewConfirmedChart() {
    this.activeAndConfirmedChart = new Chart(
      this.activeAndConfirmedChartElement.nativeElement.getContext('2d'),
      {
        type: 'bar',
        data: this.confirmedByDate,
        options: {
          responsive: true,
          legend: {
            display: false,
            position: 'right',
          },
        }
      });
  }

}

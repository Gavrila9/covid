import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart, ChartData } from 'chart.js';
import { DataPoint, Status } from './model/data-point';
import { DataService } from './service/data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'covid';

  dataPoints: DataPoint[];

  @ViewChild('groupByAgeChartElement', { static: false }) groupByAgeChartElement: ElementRef;
  groupByAgeChart: Chart;

  constructor(private dataService: DataService) {
  }

  ngOnInit() {
    this.dataService.loadData();
    this.dataService.dataPoints.subscribe(dataPoints => {
      this.dataPoints = dataPoints;

      this.drawChart(this.groupByAgeChartData);
    });
  }

  get groupByAgeChartData() {
    const data = this.groupByAge;

    return {
      labels: Object.keys(data),
      datasets: [{
        data: Object.values(data)
      }
      ]
    }
  }

  private drawChart(chartData: ChartData) {
    const ctx = this.groupByAgeChartElement.nativeElement.getContext('2d');

    this.groupByAgeChart = new Chart(ctx, {
      type: 'horizontalBar',
      data: chartData,
      options: {
        responsive: true,
        legend: {
          display: false,
          position: 'right',
        },
      }
    });
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

  get groupByAge() {
    return this.dataPoints.reduce((previous, current, index) => {
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
    })
  }

  get groupByCity() {
    return this.dataPoints.reduce((previous, current, index) => {
      if (previous[current.city]) {
        previous[current.city]++;
      } else {
        previous[current.city] = 1;
      }
      return previous;
    }, {})
  }

  get groupByConfirmedDate() {
    return this.dataPoints.reduce((previous, current, index) => {
      if (previous[current.confirmed_date]) {
        previous[current.confirmed_date]++;
      } else {
        previous[current.confirmed_date] = 1;
      }
      return previous;
    }, {})
  }
}

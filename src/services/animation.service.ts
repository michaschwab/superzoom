import { Injectable } from '@angular/core';

@Injectable()
export class AnimationService
{
  constructor()
  {

  }

  animate(duration: number, onProgress: (t : number) => void) : void
  {
    let startTime = Date.now();

    let onIncrement = () =>
    {
      let progressPercent = (Date.now() - startTime) / duration;
      if(progressPercent > 1)
      {
        progressPercent = 1;
      }

      onProgress(progressPercent);

      if(progressPercent < 1)
      {
        requestAnimationFrame(onIncrement);
      }
    };

    requestAnimationFrame(onIncrement);
  }

  animateFromTo(duration : number, startValues: number[], endValues: number[], onProgress: (interpolatedNumbers: number[]) => void) : void
  {
    let differences = endValues.map((endValue, index) => endValue - startValues[index]);
    this.animate(duration, progress =>
    {
      let interpolatedNumbers = startValues.map((startValue, index) => startValue + progress * differences[index]);
      onProgress(interpolatedNumbers);
    });
  }
}

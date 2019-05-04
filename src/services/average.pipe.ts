import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'average'})
export class AveragePipe implements PipeTransform
{
    transform(values: number[], args: string[]): number
    {
        try {
            if (values.length == 0) return NaN;
            return values.reduce((a, b) => a + b) / values.length;
        } catch(e)
        {
            console.error('can not get average of ', values);
            console.error(values);
            return NaN;
        }
    }
}

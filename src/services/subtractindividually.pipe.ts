import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'subtractindividually'})
export class SubtractIndividuallyPipe implements PipeTransform
{
    transform(values: number[][], args: string[]): number[]
    {
        return values[0].map((value, index) => value - values[1][index]);
    }
}

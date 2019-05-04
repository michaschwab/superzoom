# Multiscale Timelines Experiment

This code was used to conduct the Amazon Mechanical Turk experiment for the CHI 2019 paper, "Evaluating Pan and Zoom Timelines and Sliders", available at http://multiscale-timelines.ccs.neu.edu.

## Installation

run `npm i`, then create a src/environments/environment.ts or environment.prod.ts with:
```
export const environment = {
    production: false,
    firebase: {
        // ...
    }
};
```

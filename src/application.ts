import {Extension} from './extension';
import {interfaces} from 'inversify';

/**
 * Define a simple functional application runner
 */
export interface ApplicationRunner
{
    extensions?: Extension[];

    (container: interfaces.Container): void|Promise<void|void[]>;
}

/**
 * Define an application instance
 */
export interface ApplicationInstance
{
    extensions?: Extension[];

    run: ApplicationRunner;
}

/**
 * A generic application type
 */
export type Application = ApplicationRunner|ApplicationInstance;

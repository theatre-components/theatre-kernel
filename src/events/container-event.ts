import {interfaces} from 'inversify';

/**
 * This event is triggered during a kernel lifytime.
 *
 * @see EventDrivenKernel
 */
export interface ContainerEvent
{
    container: interfaces.Container;
}

import {ContainerEvent} from './container-event';

/**
 * This event is dispatched during a kernel lifetime
 *
 * @see EventDrivenKernel
 */
export interface ErrorEvent extends ContainerEvent
{
    error: Error;
}

import {Application} from './../application';
import {ContainerEvent} from './container-event';

/**
 * This event is dispatched during a kernel lifetime
 *
 * @see EventDrivenKernel
 */
export interface ApplicationEvent extends ContainerEvent
{
    application: Application;
}

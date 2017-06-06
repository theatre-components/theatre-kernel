import {Extension} from './../extension';
import {ContainerEvent} from './container-event';

/**
 * This event is dispatched during a kernel lifetime
 *
 * @see EventDrivenKernel
 */
export interface ExtensionEvent extends ContainerEvent
{
    extension: Extension;
}

import {Extension} from './extension';
import {Application} from './application';

/**
 * A kernel is a singular way of running a process. It encapsulate an container
 * from inversify.
 *
 * @see http://inversify.io/ for a complete documentation on the container engine.
 */
export interface Kernel
{
    /**
     * Run a given process.
     */
    run(application: Application): Promise<void|void[]>;

    /**
     * Add a kernel extension
     */
    addExtension(extension: Extension): void;

    /**
     * Test if a kernel has this extension
     */
    hasExtension(extension: Extension): boolean;

    /**
     * Remove an extension from the kernel
     */
    removeExtension(extension: Extension): void;
}

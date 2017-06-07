import {Extension, PRIORITY_NORMAL} from './../extension';
import {ContainerEvent} from './../events/container-event';
import {ErrorEvent} from './../events/error-event';
import {ExtensionEvent} from './../events/extension-event';
import {ApplicationEvent} from './../events/application-event';
import {EventDispatcher, AsynchronousEventDispatcher, EventListener} from 'theatre-events';
import {interfaces, Container, decorate, injectable} from 'inversify';
import {Application} from './../application'
import {Kernel} from './../kernel';

/**
 * An implementation of a kernel hookable with events
 *
 * @see theatre-events library
 */
export class EventDrivenKernel implements Kernel
{
    /**
     * A unique identifier used to bind the event dispatcher service
     */
    static readonly EVENT_DISPATCHER = Symbol('AsynchronousEventDispatcher');

    /**
     * Trigger before ANY extensions. This event is blocking
     *
     * @see ContainerEvent
     */
    static readonly BEFORE_EXTENSIONS = Symbol('BeforeExtensions');

    /**
     * Trigger before each extension. This event is blocking
     *
     * @see ExtensionEvent
     */
    static readonly BEFORE_EXTENSION = Symbol('BeforeExtension');

    /**
     * Trigger after each extension. This event is not blocking
     *
     * @see ExtensionEvent
     */
    static readonly AFTER_EXTENSION = Symbol('AfterExtensions');

    /**
     * Trigger after ALL the extensions. This event is not blocking
     *
     * @see ContainerEvent
     */
    static readonly AFTER_EXTENSIONS = Symbol('AfterExtensions');

    /**
     * Trigger just before the application. This event is blocking
     *
     * @see ApplicationEvent
     */
    static readonly BEFORE_RUN = Symbol('BeforeRun');

    /**
     * Trigger after the application. This event is not blocking
     *
     * @see ApplicationEvent
     */
    static readonly AFTER_RUN = Symbol('AfterRun');

    /**
     * Trigger when an error occured. This event is blocking
     *
     * @see ErrorEvent
     */
    static readonly ON_ERROR = Symbol('OnError');

    /**
     * Trigger when the kernel stop. This event is blocking
     *
     * @see ApplicationEvent
     */
    static readonly ON_STOP = Symbol('OnStop');

    protected container: interfaces.Container;

    protected extensions: Map<number, Extension[]>;

    constructor(container?: interfaces.Container)
    {
        this.container = container || new Container();
        this.extensions = new Map();
    }

    /**
     * {@inheritdoc}
     */
    run(application: Application): Promise<void|void[]>
    {
        let promise = this.dispatcher.dispatch<ContainerEvent>(EventDrivenKernel.BEFORE_EXTENSIONS, {
            container: this.container
        });

        return (<Promise<void[]>>promise)
            .then(() => {
                let extensions = this.concatenateApplicationExtension(application);
                let priorities = Array.from(extensions.keys()).sort();
                let latestPromise: any = null;

                for (let priority of priorities) {
                    for (let extension of extensions.get(priority)) {
                        latestPromise = !latestPromise ?
                            this.dispatcher.dispatch<ExtensionEvent>(EventDrivenKernel.BEFORE_EXTENSION, {
                                container: this.container,
                                extension
                            }) :
                            latestPromise.then(() => this.dispatcher.dispatch<ExtensionEvent>(EventDrivenKernel.BEFORE_EXTENSION, {
                                container: this.container,
                                extension
                            }))
                        ;

                        latestPromise.then(() => {
                            typeof extension === 'function' ?
                                extension(this.container) :
                                extension.extend(this.container)
                            ;

                            this.dispatcher.dispatch<ExtensionEvent>(EventDrivenKernel.AFTER_EXTENSION,  {
                                container: this.container,
                                extension
                            });
                        });
                    }
                }

                return latestPromise;
            })
            .then(() => {
                this.dispatcher.dispatch<ContainerEvent>(EventDrivenKernel.AFTER_EXTENSIONS, {
                    container: this.container,
                });

                return this.dispatcher.dispatch<ApplicationEvent>(EventDrivenKernel.BEFORE_RUN, {
                    container: this.container,
                    application
                });
            })
            .then(() => {
                if ('function' === typeof application) {
                    return application(this.container);
                }

                return application.run(this.container);
            })
            .then(() => {
                this.dispatcher.dispatch<ApplicationEvent>(EventDrivenKernel.AFTER_RUN, {
                    container: this.container,
                    application
                });

                return this.dispatcher.dispatch<ApplicationEvent>(EventDrivenKernel.ON_STOP, {
                    container: this.container,
                    application
                });
            })
            .catch((error: Error) => {
                return this.dispatcher.dispatch<ErrorEvent>(EventDrivenKernel.ON_ERROR, {
                    container: this.container,
                    error
                });
            })
        ;
    }

    /**
     * {@inheritdoc}
     */
    addExtension(extension: Extension): void
    {
        extension.priority = extension.priority || PRIORITY_NORMAL;

        if (!this.extensions.has(extension.priority)) {
            this.extensions.set(extension.priority, []);
        }

        this.extensions.get(extension.priority).push(extension);
    }

    /**
     * {@inheritdoc}
     */
    hasExtension(extension: Extension): boolean
    {
        let found: boolean = false;

        this.extensions.forEach((extensions) => {
            extensions.forEach(e => {
                if (e === extension) {
                    found = true;
                }
            })
        });

        return found;
    }

    /**
     * {@inheritdoc}
     */
    removeExtension(extension: Extension): void
    {
        this.extensions.forEach((extensions, i) => {
            extensions.forEach((e, i2) => {
                if (e === extension) {
                    extensions.splice(i2, 1);
                }
            });

            if (!extensions.length) {
                this.extensions.delete(i);
            }
        });
    }

    /**
     * This is a simple shortcuts to attach an error listener
     */
    addErrorListener(listener: EventListener): void
    {
        this.dispatcher.addEventListener(EventDrivenKernel.ON_ERROR, listener);
    }

    get dispatcher(): EventDispatcher
    {
        if (!this.container.isBound(EventDrivenKernel.EVENT_DISPATCHER)) {
            decorate(injectable(), AsynchronousEventDispatcher);

            this
                .container
                .bind(EventDrivenKernel.EVENT_DISPATCHER)
                .to(AsynchronousEventDispatcher)
                .inSingletonScope()
            ;
        }

        return this.container.get<EventDispatcher>(EventDrivenKernel.EVENT_DISPATCHER);
    }

    private concatenateApplicationExtension(application: Application): Map<number, any[]>
    {
        if (!application.extensions) {
            return this.extensions;
        }

        application.extensions.forEach(extension => {
            extension.priority = extension.priority || PRIORITY_NORMAL;

            if (!this.extensions.get(extension.priority)) {
                this.extensions.set(extension.priority, []);
            }

            this.extensions.get(extension.priority).push(extension);
        });

        return this.extensions;
    }
}

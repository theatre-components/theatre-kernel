import {AsynchronousEventDispatcher} from 'theatre-events';
import {interfaces, Container} from 'inversify';
import {
    EventDrivenKernel,
    PRIORITY_NORMAL,
    PRIORITY_HIGH,
    PRIORITY_LOW,
    Extension,
    Application
} from "./../../src";

describe('EventDrivenKernel', () => {
    let kernel: EventDrivenKernel;
    let dispatcher: AsynchronousEventDispatcher;
    let container: interfaces.Container;

    beforeEach(() => {
        container = new Container();
        dispatcher = new AsynchronousEventDispatcher();

        container.bind(EventDrivenKernel.EVENT_DISPATCHER).toConstantValue(dispatcher);

        kernel = new EventDrivenKernel(container);
    });

    it('run an application runner or instance', (next) => {
        let application: Application = (c: interfaces.Container) => {
            expect(c).toBe(container);
        };

        let applicationInstance: Application = {
            run(c: interfaces.Container) {
                expect(c).toBe(container);
            }
        };

        kernel.run(application).then(() => {
            return kernel.run(applicationInstance);
        }).then(next).catch((e: any) => {
            expect(e).not.toBeDefined();

            next();
        });
    });

    it('can register extensions and extend a container behavior', (next) => {
        const triggers: {[index: string]: boolean;} = {
            e1: false,
            e2: false,
            e3: false,
            ae1: false,
            ae2: false,
            ae3: false
        };

        let e1: Extension = (c: interfaces.Container) => {
            expect(c).toBe(container);
            expect(triggers.e3).toBe(true);
            expect(triggers.e2).toBe(true);

            triggers.e1 = true;
        };
        e1.priority = PRIORITY_LOW;

        let e2 = {
            priority: PRIORITY_HIGH,
            extend(c: interfaces.Container) {
                expect(c).toBe(container);
                expect(triggers.e1).toBe(false);
                expect(triggers.e3).toBe(false);

                triggers.e2 = true;
            }
        }

        let e3 = {
            priority: PRIORITY_NORMAL,
            extend(c: interfaces.Container) {
                expect(c).toBe(container);
                expect(triggers.e1).toBe(false);
                expect(triggers.e2).toBe(true);

                triggers.e3 = true;
            }
        }

        let appExtensions: Extension[] = [
            (c: interfaces.Container) => { expect(c).toBe(container); triggers.ae1 = true; },
            (c: interfaces.Container) => { expect(c).toBe(container); triggers.ae2 = true; },
            (c: interfaces.Container) => { expect(c).toBe(container); triggers.ae3 = true; },
        ];

        let app: Application = (c: interfaces.Container) => {
            expect(c).toBe(container);
        };
        app.extensions = appExtensions;

        kernel.addExtension(e1);
        kernel.addExtension(e2);
        kernel.addExtension(e3);

        expect(kernel.hasExtension(e1)).toBe(true);
        expect(kernel.hasExtension(e2)).toBe(true);
        expect(kernel.hasExtension(e3)).toBe(true);

        kernel.removeExtension(e1);

        expect(kernel.hasExtension(e1)).toBe(false);

        kernel.addExtension(e1);

        kernel.run(app).then(() => {
            for (let key in triggers) {
                expect(triggers[key]).toBe(true);
            }

            next();
        }).catch((e: any) => {
            expect(e).not.toBeDefined();

            next();
        });
    });

    it('dispatch events during it\'s entire lifetime', (next) => {
        spyOn(dispatcher, 'dispatch').and.callThrough();

        let extension: Extension = (c: interfaces.Container) => {
            expect(c).toBe(container);
        };

        kernel.addExtension(extension);

        let application: Application = (c: interfaces.Container) => {
            expect(c).toBe(container);
        };

        kernel.run(application).then(() => {
            expect(dispatcher.dispatch).toHaveBeenCalledWith(EventDrivenKernel.BEFORE_EXTENSIONS, {
                container
            });
            expect(dispatcher.dispatch).toHaveBeenCalledWith(EventDrivenKernel.BEFORE_EXTENSION, {
                container,
                extension
            });
            expect(dispatcher.dispatch).toHaveBeenCalledWith(EventDrivenKernel.AFTER_EXTENSION, {
                container,
                extension
            });
            expect(dispatcher.dispatch).toHaveBeenCalledWith(EventDrivenKernel.AFTER_EXTENSIONS, {
                container
            });
            expect(dispatcher.dispatch).toHaveBeenCalledWith(EventDrivenKernel.BEFORE_RUN, {
                container,
                application
            });
            expect(dispatcher.dispatch).toHaveBeenCalledWith(EventDrivenKernel.AFTER_RUN, {
                container,
                application
            });
            expect(dispatcher.dispatch).toHaveBeenCalledWith(EventDrivenKernel.ON_STOP, {
                container,
                application
            });

            expect(dispatcher.dispatch).toHaveBeenCalledTimes(7);

            next();
        }).catch((e: any) => {
            expect(e).not.toBeDefined();

            next();
        });
    });

    it('can handle errors with a dispatched event', (next) => {
        let trigger = false;

        spyOn(dispatcher, 'dispatch').and.callThrough();

        kernel.addErrorListener((e: any) => {
            expect(e.error instanceof Error).toBe(true);
            expect(e.error.message).toBe('test');

            trigger = true;
        });

        kernel.run(() => {
            throw new Error('test');
        }).then(() => {
            expect(trigger).toBe(true);
            expect(dispatcher.dispatch).toHaveBeenCalledWith(EventDrivenKernel.ON_ERROR, jasmine.any(Object));

            next();
        });
    });
});

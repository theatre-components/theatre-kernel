Theatre Kernel
==============

[![Circle CI](https://circleci.com/gh/theatre-components/theatre-kernel/tree/master.svg?style=shield)](https://circleci.com/gh/theatre-components/theatre-kernel/tree/master)
[![npm version](https://badge.fury.io/js/theatre-kernel.svg)](https://badge.fury.io/js/theatre-kernel)
[![dependencies](https://david-dm.org/theatre-components/theatre-kernel.svg)](https://david-dm.org/theatre-components/theatre-kernel)
[![WTFPL Licence](http://www.wtfpl.net/wp-content/uploads/2012/12/wtfpl-badge-2.png)](http://www.wtfpl.net/about/)

This library is a part of the **Theatre** module. You can use it ase is or with a complete **Theatre** installation.

## About

**Theatre Kernel** is a very short implementation of an application runner. It introduces a simple way
to run application on top of [inversify](http://inversify.io/).

## Installation

```
npm install theatre-kernel --save
```

## Quick Start

This little module introduce a single class allowing you to run any kind of application. To do
so you have two components: An **application** and some **container extensions**.

1. **The application**: The application run a process allowing your domain to be implementated. It can be a singular
function or a given class.
2. **The container extension(s)**: It bind services inside the containers. Allowing your application to respect the
**IOC** principles.

### A basic example: Hello World

This is a simple and dumb example but it shows the main functionality.

```javascript
import {EventDrivenKernel} from 'theatre-kernel';

const kernel = new EventDrivenKernel();

// Register a user inside the container
kernel.addExtension(container => {
    container.bind('user').toConstantValue({
        firstname: 'John',
        lastname: 'Doe'
    });
});

// Finally run our hello world application
kernel.run(container => {
    const user = container.get('user');

    console.log(`Hello ${user.firstname} ${user.lastname}`);
}).then(() => {
    console.log('Application ended well');
}).catch(error => {
    console.log('Oh crap! An error!');
    console.error(error);
});
```

### Working with Classes

Let's take our previous example but with classes implementation:

```javascript
// src/application.js
class Application
{
    run(container)
    {
        const user = container.get('user');

        console.log(`Hello ${user.firstname} ${user.lastname}`);
    }

    // Application can brings there own extensions:
    get extensions()
    {
        return [container => {
            container.bind('user').toConstantValue({
                firstname: 'John',
                lastname: 'Doe'
            });
        }];
    }
}
```

```javascript
// src/index.js
import {Application} from './application';
import {EventDrivenKernel} from 'theatre-kernel';

const kernel = new EventDrivenKernel();

kernel.run(new Application());
```

### Hooking the running process with events

**Theatre kernel** is using **theatre events** to dispatch usefull events for any
hook process. Basically you can declare your own `EventDispatcher` or use an extension
and retrieve the default `EventDispatcher` instance.

### With an extension

```javascript
import {EventDrivenKernel} from 'theatre-kernel';

const kernel = new EventDrivenKernel();

kernel.addExtension(container => {
    const dispatcher = container.get(EventDrivenKernel.EVENT_DISPATCHER);

    // Listen to the `BEFORE_RUN` and `AFTER_RUN` events wich is launch at the start and the end of your application.
    dispatcher.addEventListener(EventDrivenKernel.BEFORE_RUN, (event) => {
        // You can retrieve the application and the container with `event.application` and `event.container

        console.log('Application will run');
    });
    dispatcher.addEventListener(EventDrivenKernel.AFTER_RUN, (event) => {
        // You can retrieve the application and the container with `event.application` and `event.container

        console.log('Application has runned');
    });
});

kernel.run(container => console.log('Application'));
```

### With your own event dispatcher

```javascript
import {Container} from 'inversify';
import {AsynchronousEventDispatcher} from 'theatre-events';
import {EventDrivenKernel} from 'theatre-kernel';

// Create your own container and dispatcher
const container = new Container();
const dispatcher = new AsynchronousEventDispatcher();

// Listen to the `BEFORE_RUN` and `AFTER_RUN` events wich is launch at the start and the end of your application.
dispatcher.addEventListener(EventDrivenKernel.BEFORE_RUN, (event) => {
    // You can retrieve the application and the container with `event.application` and `event.container

    console.log('Application will run');
});
dispatcher.addEventListener(EventDrivenKernel.AFTER_RUN, (event) => {
    // You can retrieve the application and the container with `event.application` and `event.container

    console.log('Application has runned');
});

// Bind your dispatcher:
container.bind(EventDrivenKernel.EVENT_DISPATCHER).toConstantValue(dispatcher);

// Create your kernel
const kernel = new EventDrivenKernel(container);

// Run your application
kernel.run(container => console.log('Application'));
```

### Complete list of events

```typescript
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
```

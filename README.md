
<p align="center">
  <a href="https://www.sayaplatform.com/">
    <img alt="SAYA Platform" src="https://www.sayaplatform.com/wp-content/uploads/2021/12/saya-logo-4.png" width="250" />
  </a>
</p>

[![On Push](https://github.com/3cortextechnologies/saya-antora-ui/actions/workflows/push.yml/badge.svg?branch=main)](https://github.com/3cortextechnologies/saya-antora-ui/actions/workflows/push.yml)


This project generates and packages the static resources that SAYA uses for document production.

This project is based on [Spring Antora UI](https://github.com/spring-io/antora-ui-spring).


## Development Quickstart

This section offers a basic tutorial to teach you how to preview it locally, and bundle it for use with Antora.
A more comprehensive tutorial can be found in the documentation at [docs.antora.org](https://docs.antora.org/).

### Prerequisites

To preview and bundle the SAYA Antora UI, you need the following software on your computer:

* [git](https://git-scm.com/) (command: `git`)
* [Node.js](https://nodejs.org/) (commands: `node` and `npm`)
* [Gulp CLI](http://gulpjs.com/) (command: `gulp`)

### Preview the UI

The SAYA Antora UI project is configured to preview offline.
The files in the `preview-src/` folder provide the sample content that allow you to see the UI in action.
In this folder, you'll primarily find pages written in AsciiDoc.
These pages provide a representative sample and kitchen sink of content from the real site.

To build the UI and preview it in a local web server, run the `preview` command:

```
npm install
gulp preview
```

You'll see a URL listed in the output of this command:

```
[12:00:00] Starting server...
[12:00:00] Server started http://localhost:5252
[12:00:00] Running server
```

Navigate to this URL to preview the site locally.

While this command is running, any changes you make to the source files will be instantly reflected in the browser.
This works by monitoring the project for changes, running the `preview:build` task if a change is detected, and sending the updates to the browser.

Press `Ctrl`+`C` to stop the preview server and end the continuous build.

### Package for Use with Antora

If you need to package the UI so you can use it to generate the documentation site locally, run the following command:

```
gulp bundle
```

If any errors are reported by lint, you'll need to fix them.

When the command completes successfully, the UI bundle will be available at `build/ui-bundle.zip`.
You can point Antora at this bundle using the `--ui-bundle-url` command-line option.

If you have the preview running, and you want to bundle without causing the preview to be clobbered, use:

```
gulp bundle:pack
```

The UI bundle will again be available at `build/ui-bundle.zip`.

## Authors

Development of Antora is led and sponsored by [OpenDevise Inc](https://opendevise.com/).

## Copyright and License

Copyright (C) 2017-present OpenDevise Inc. and the Antora Project.

Use of this software is granted under the terms of the [Mozilla Public License Version 2.0](https://www.mozilla.org/en-US/MPL/2.0/) (MPL-2.0).

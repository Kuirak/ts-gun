# TS-Gun (Work in Progress)

A modular [gun](https://github.com/amark/gun) implementation in Typescript.


## The goal of this port
1) Learn how gun is implemented and implement the core in Typescript without the chaining API
2) Provide atleast one alternative API e.g. `graphql` or `RxJS`
3) Export multiple packages to make modular usage easier (e.g. Don't ship server code if one wants to use WebRTC only)
4) Have a good performance while having an easy to navigate source code


## Build
This project uses yarn workspaces.
```
yarn workspaces run build
```

# uclassroom/ucore-base
#
# VERSION               0.0.2

FROM fedora/ssh
MAINTAINER Guo Xu <ggxx120@gmail.com>

RUN yum -y install nodejs npm make emacs nano vim git wget gcc gcc-c++ gdb autoconf automake net-tools tar gzip bzip2 qemu;\
	npm install -g tty.js;\
	yum clean all;\
	mkdir /root/.ssh;\
	mkdir /opt/ttyjs

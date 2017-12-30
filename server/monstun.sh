#!/bin/sh
#ps ef | grep turnserver | grep -v grep
netstat -ulnp | grep 3478 | grep turnserver
if [ $? -ne 0 ]
then
	/usr/bin/turnserver -S > /dev/null &
fi

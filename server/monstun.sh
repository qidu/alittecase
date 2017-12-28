#!/bin/sh
ps ef | grep turnserver | grep -v grep
if [ $? -ne 0 ]
then
	/usr/bin/turnserver -S > /dev/null &
fi

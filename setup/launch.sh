#!/bin/bash

UP=$(pgrep mysql | wc -l);

if [ "$UP" -eq 0 ]
then
	echo "MySQL is not currently running."
	ON=false
else
	echo "MySQL currently running."
fi

if [ "$ON" = "false" ]
then
	mysql.server start &
	wait
fi

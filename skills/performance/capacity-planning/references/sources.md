# Primary grounding

Inspected 2026-10-01; calculations are application models with stated assumptions,
not platform guarantees or observed fleet capacity.

- [SRE handling overload](https://sre.google/sre-book/handling-overload/): resource
  cost and the limits of QPS-only sizing, selected 2016 chapter sections.
- [SRE Workbook managing load](https://sre.google/workbook/managing-load/):
  autoscaling delays, spare capacity and interacting controls, selected 2018
  chapter sections.
- [MIT queueing lecture, Spring 2026](https://web.mit.edu/1.041/www/lectures/L8-queuing-models-2026sp.pdf):
  PDF pages 14–18, 20 and 32 on stability, mean measures and effective arrivals.
  Net-backlog and resource-demand equations are derived dimensional accounting.
- [Kubernetes HPA](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/):
  controller/metric and stabilization behavior. Verify deployed version and
  controller flags; these are conditional Kubernetes details.
